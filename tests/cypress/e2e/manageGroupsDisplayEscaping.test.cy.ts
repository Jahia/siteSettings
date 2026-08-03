// Regression test: the Manage Groups edit-group members list renders a member's display name as
// inert TEXT (never live DOM/HTML), including when that member's jcr:title (self-settable by any
// authenticated user) carries markup. Self-contained — creates its own site, group, and a member
// user in before(), tears the site down in after(). Structural sibling of
// manageUsersDisplayEscaping.test.cy.ts.
//
// This screen ships two JSP view variants for the same flow. The `.manageGroups.html` admin route
// resolves to the `settingsBootstrap3GoogleMaterialStyle` variant in practice (confirmed empirically:
// the webflow execution URL carries that view name, e.g.
// `...webflowexecution<id>__settingsBootstrap3GoogleMaterialStyle=...`) — this test asserts on that
// URL marker to pin coverage to the variant this admin route actually renders.
import { createSite, deleteSite } from '@jahia/cypress'

describe('Manage Groups - member display name rendering', () => {
    const SITE = 'manageGroupsEscapingSite'
    const GROUP = 'groupwithmarkupmember'
    const USER = 'groupmarkupmember'
    const MARKUP = '<img src=x onerror=window.__groupMembersMarkupExecuted=1>'

    before(() => {
        createSite(SITE, {
            languages: 'en',
            templateSet: 'templates-system',
            serverName: 'localhost',
            locale: 'en',
        })
        cy.executeGroovy('groovy/createSiteUserWithTitle.groovy', {
            USER_NAME: USER,
            SITE_KEY: SITE,
            PASSWORD: 'GroupMemberPass123!',
            TITLE_VALUE: MARKUP,
        }).then((raw) => {
            if (String(raw ?? '').includes('.failed')) {
                throw new Error(`createSiteUserWithTitle failed: ${raw}`)
            }
        })
        // give the member a first/last name so the adjacent Name column renders a plain name
        // instead of falling back to the same display-name value this test asserts on below —
        // without this, that column would independently satisfy the assertion too.
        cy.executeGroovy('groovy/setSiteUserName.groovy', {
            USER_NAME: USER,
            SITE_KEY: SITE,
            FIRST_NAME_VALUE: 'Group',
            LAST_NAME_VALUE: 'Member',
        }).then((raw) => {
            if (String(raw ?? '').includes('.failed')) {
                throw new Error(`setSiteUserName failed: ${raw}`)
            }
        })
        cy.executeGroovy('groovy/createSiteGroup.groovy', {
            SITE_KEY: SITE,
            GROUP_NAME: GROUP,
        }).then((raw) => {
            if (String(raw ?? '').includes('.failed')) {
                throw new Error(`createSiteGroup failed: ${raw}`)
            }
        })
        cy.executeGroovy('groovy/addSiteMemberToSiteGroup.groovy', {
            SITE_KEY: SITE,
            GROUP_NAME: GROUP,
            MEMBER_NAME: USER,
        }).then((raw) => {
            if (String(raw ?? '').includes('.failed')) {
                throw new Error(`addSiteMemberToSiteGroup failed: ${raw}`)
            }
        })
    })

    after(() => {
        deleteSite(SITE)
    })

    it('renders a member display name containing markup as literal text (no active element, no handler fires)', () => {
        cy.login()
        cy.visit(`/cms/editframe/default/en/sites/${SITE}.manageGroups.html`, {
            onBeforeLoad(win) {
                ;(win as unknown as Record<string, unknown>).__groupMembersMarkupExecuted = undefined
            },
        })

        // open the group's members list — this is the real admin flow (submitGroupForm('editGroup', ...)),
        // not a hand-rolled webflow POST.
        cy.get(`a:contains(${GROUP})`, { timeout: 10000 }).first().click()

        // confirm which view variant rendered — this test's coverage is specific to
        // settingsBootstrap3GoogleMaterialStyle, not incidental to it.
        cy.location('href').should('include', 'settingsBootstrap3GoogleMaterialStyle')

        // the display name must appear as escaped literal text in a table cell
        cy.contains('td', MARKUP, { timeout: 10000 }).should('be.visible')
        // and must NOT have become a live <img> element carrying an onerror handler
        cy.get('td img[onerror]').should('not.exist')

        // definitive live check: the onerror handler must never have executed
        cy.window().then((win) => {
            expect(
                (win as unknown as Record<string, unknown>).__groupMembersMarkupExecuted,
                'the onerror handler must not fire',
            ).to.be.undefined
        })
    })
})
