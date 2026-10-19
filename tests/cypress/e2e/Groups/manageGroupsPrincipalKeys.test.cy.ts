// Asserts that the key of a user or a group (its repository path) reaches the Manage Groups screens
// verbatim: as the value of a member checkbox, and as the argument of a row action, when the principal
// name carries reserved markup characters, quotes included. Covers the group list, the members list of a
// group, and the user and group pickers. Self-contained: creates its own site and principals in before(),
// tears the site down in after().
//
// The `.manageGroups.html` route renders the settingsBootstrap3GoogleMaterialStyle view variant; the test
// asserts that marker so its coverage is pinned to that variant.
import { createSite, deleteSite } from '@jahia/cypress'

describe('Manage Groups - principal key rendering', () => {
    const SITE = 'manageGroupsPrincipalKeysSite'
    const HOST_GROUP = 'principalkeyshost'
    const FLAG = '__groupKeysHandlerFired'
    // A JCR name cannot contain '/', so the names are slash-free.
    const MEMBER = `member'"><img src=x onerror=window.${FLAG}=1>`
    const GROUP = `group'"><img src=x onerror=window.${FLAG}=1>`
    // a name a person could type, with accents, an ampersand, angle brackets and quotes
    const CANDIDATE = `zoé & <o'brien> "qa"`

    const keyOf = (prefix: string, name: string) => (value: string) =>
        value.startsWith(prefix) && value.endsWith(`/${name}`)

    const checkboxValues = (selector: string) =>
        cy.get(selector).then(($inputs) => $inputs.toArray().map((input) => (input as HTMLInputElement).value))

    const expectNoHandlerFired = () => {
        cy.get('table img[onerror]').should('not.exist')
        cy.window().then((win) => {
            expect((win as unknown as Record<string, unknown>)[FLAG], 'the onerror handler must not fire').to.be
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
        cy.executeGroovy('groovy/createSitePrincipalsWithEncodedNames.groovy', {
            SITE_KEY: SITE,
            HOST_GROUP,
            PASSWORD: 'PrincipalKeysPass123!',
            MEMBER_NAME_B64: btoa(unescape(encodeURIComponent(MEMBER))),
            CANDIDATE_NAME_B64: btoa(unescape(encodeURIComponent(CANDIDATE))),
            GROUP_NAME_B64: btoa(unescape(encodeURIComponent(GROUP))),
        }).then((raw) => {
            if (String(raw ?? '').includes('.failed')) {
                throw new Error(`createSitePrincipalsWithEncodedNames failed: ${raw}`)
            }
        })
    })

    after(() => {
        deleteSite(SITE)
    })

    it('keeps principal keys verbatim in the group list, the members list and the pickers', () => {
        cy.login()
        cy.visit(`/cms/editframe/default/en/sites/${SITE}.manageGroups.html`)

        // group list: the copy action receives the exact group key
        cy.contains('tr', GROUP, { timeout: 10000 }).should('be.visible')
        cy.window().then((win) => {
            cy.stub(win as unknown as Record<string, () => void>, 'submitGroupForm').as('submitGroupForm')
        })
        cy.contains('tr', GROUP).find('a[href="#copy"]').click()
        cy.get('@submitGroupForm')
            .should('have.been.calledOnce')
            .its('firstCall.args')
            .then((args: string[]) => {
                expect(args[0]).to.eq('copyGroup')
                expect(keyOf('/sites/', GROUP)(args[1]), `copy key ${args[1]}`).to.be.true
            })
        expectNoHandlerFired()
        cy.get<sinon.SinonStub>('@submitGroupForm').then((stub) => stub.restore())

        // members list of the host group
        cy.get(`a:contains(${HOST_GROUP})`).first().click()
        cy.location('href').should('include', 'settingsBootstrap3GoogleMaterialStyle')
        cy.contains('td', MEMBER, { timeout: 10000 }).should('be.visible')
        checkboxValues('input[name="selectedMembers"]').then((values) => {
            expect(values.some(keyOf('u:/', MEMBER)), `member keys ${values}`).to.be.true
            expect(values.some(keyOf('g:/', GROUP)), `member keys ${values}`).to.be.true
        })
        expectNoHandlerFired()

        // the remove action of the member row receives the member name and the exact member key
        cy.window().then((win) => {
            cy.stub(win as unknown as Record<string, () => boolean>, 'removeGroupMember')
                .returns(false)
                .as('removeGroupMember')
        })
        cy.contains('tr', MEMBER).find('button[name="_eventId_removeMembers"]').click()
        cy.get('@removeGroupMember')
            .should('have.been.calledOnce')
            .its('firstCall.args')
            .then((args: string[]) => {
                expect(args[0], 'confirmation message').to.contain(MEMBER)
                expect(keyOf('u:/', MEMBER)(args[1]), `remove key ${args[1]}`).to.be.true
            })
        cy.get<sinon.SinonStub>('@removeGroupMember').then((stub) => stub.restore())

        // user picker
        cy.get('[name="_eventId_editGroupMembers"]').click()
        cy.contains('td', CANDIDATE, { timeout: 10000 }).should('be.visible')
        checkboxValues('input.selectedMember').then((values) => {
            expect(values.some(keyOf('/', MEMBER)), `user keys ${values}`).to.be.true
            expect(values.some(keyOf('/', CANDIDATE)), `user keys ${values}`).to.be.true
        })
        expectNoHandlerFired()

        // group picker
        cy.get('[data-sel-role="switchToGroupsView"]').click()
        cy.contains('td', GROUP, { timeout: 10000 }).should('exist')
        checkboxValues('input.selectedMember').then((values) => {
            expect(values.some(keyOf('/sites/', GROUP)), `group keys ${values}`).to.be.true
        })
        expectNoHandlerFired()

        // adding a user from the picker stores the user its checkbox names
        cy.get('[data-sel-role="switchToUsersView"]').click()
        cy.contains('td', CANDIDATE, { timeout: 10000 }).should('be.visible')
        cy.get('input.selectedMember')
            .filter((_, input) => keyOf('/', CANDIDATE)((input as HTMLInputElement).value))
            .check({ force: true })
        cy.get('#saveButton').click()
        cy.contains('td', CANDIDATE, { timeout: 10000 }).should('be.visible')
        checkboxValues('input[name="selectedMembers"]').then((values) => {
            expect(values.some(keyOf('u:/', CANDIDATE)), `member keys ${values}`).to.be.true
        })
        expectNoHandlerFired()
    })
})
