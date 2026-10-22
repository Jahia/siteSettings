// Asserts that the groups list of the Manage Users edit and remove screens carries each group key and
// group name verbatim, as the value and the title of its option, when the group name holds reserved
// markup characters, quotes included. Self-contained: creates its own site, user and groups in before(),
// tears the site down in after().
//
// The `.manageUsers.html` route renders the settingsBootstrap3GoogleMaterialStyle view variant; the test
// asserts that marker so its coverage is pinned to that variant.
import { createSite, deleteSite } from '@jahia/cypress'

describe('Manage Users - group options', () => {
    const SITE = 'manageUsersGroupOptionsSite'
    const USER = 'groupoptionsuser'
    const FLAG = '__groupOptionHandlerFired'
    // A JCR name cannot contain '/', so the names are slash-free.
    const PLAIN_GROUP = 'plainoptionsgroup'
    const QUOTED_GROUP = `optionsgroup" data-extra="1" onmouseover="window.${FLAG}=1`
    // a name a person could type, with accents, an ampersand, angle brackets and quotes
    const TYPED_GROUP = `zoé & <o'brien> "qa"`
    const GROUPS = [PLAIN_GROUP, QUOTED_GROUP, TYPED_GROUP]

    const keyOf = (name: string) => `g/sites/${SITE}/groups/${name}`

    type Option = { value: string; title: string; attributes: string[] }

    const groupOptions = () =>
        cy.get('select[name="selectMember"] option').then(($options) =>
            $options.toArray().map(
                (option): Option => ({
                    value: (option as HTMLOptionElement).value,
                    title: option.getAttribute('title') ?? '',
                    attributes: option.getAttributeNames(),
                }),
            ),
        )

    const openUserAction = (action: '#edit' | '#delete') => {
        cy.login()
        cy.visit(`/cms/editframe/default/en/sites/${SITE}.manageUsers.html`, {
            onBeforeLoad(win) {
                ;(win as unknown as Record<string, unknown>)[FLAG] = undefined
            },
        })
        cy.get('#searchString').clear()
        cy.get('#searchString').type(USER)
        cy.get('[name="_eventId_search"]').first().click()
        cy.get(`a[href="${action}"]`, { timeout: 10000 }).first().click()
        cy.location('href').should('include', 'settingsBootstrap3GoogleMaterialStyle')
    }

    const expectNoHandlerFired = () => {
        cy.window().then((win) => {
            expect((win as unknown as Record<string, unknown>)[FLAG], 'the mouseover handler must not fire').to.be
                .undefined
        })
    }

    before(() => {
        createSite(SITE, {
            languages: 'en',
            templateSet: 'templates-system',
            serverName: 'localhost',
            locale: 'en',
        })
        cy.executeGroovy('groovy/createSiteUserInEncodedGroups.groovy', {
            SITE_KEY: SITE,
            USER_NAME: USER,
            PASSWORD: 'GroupOptionsPass123!',
            GROUP_NAMES_B64: GROUPS.map((name) => btoa(unescape(encodeURIComponent(name)))).join(','),
        }).then((raw) => {
            if (String(raw ?? '').includes('.failed')) {
                throw new Error(`createSiteUserInEncodedGroups failed: ${raw}`)
            }
        })
    })

    after(() => {
        deleteSite(SITE)
    })

    it('keeps group keys and names verbatim in the groups list of the edit screen', () => {
        openUserAction('#edit')

        groupOptions().then((options) => {
            // the list rendered, with the plain group as expected
            expect(
                options.map((o) => o.value),
                'plain group option',
            ).to.include(keyOf(PLAIN_GROUP))
            GROUPS.forEach((name) => {
                const option = options.find((o) => o.value === keyOf(name))
                expect(option, `option of ${name} in ${JSON.stringify(options)}`).to.exist
                expect(option.title, `title of ${name}`).to.eq(name)
            })
            options.forEach((o) => expect(o.attributes, `attributes of ${o.value}`).to.have.members(['value', 'title']))
        })

        cy.get('select[name="selectMember"] option').each(($option) => {
            cy.wrap($option).trigger('mouseover')
        })
        expectNoHandlerFired()
    })

    it('keeps group keys verbatim in the groups list of the remove screen', () => {
        openUserAction('#delete')

        groupOptions().then((options) => {
            expect(
                options.map((o) => o.value),
                'plain group option',
            ).to.include(keyOf(PLAIN_GROUP))
            GROUPS.forEach((name) => {
                expect(
                    options.some((o) => o.value === keyOf(name)),
                    `option of ${name} in ${JSON.stringify(options)}`,
                ).to.be.true
            })
            options.forEach((o) => expect(o.attributes, `attributes of ${o.value}`).to.have.members(['value']))
        })
        expectNoHandlerFired()
    })
})
