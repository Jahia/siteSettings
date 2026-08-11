// Candidate-member store test for the Manage Groups administration screen. The screen offers
// principals to add to a group, and the store those candidates come from is the realm the screen
// administers — the same store its group listing and its provider listing answer for. Which store is
// searched is therefore settled by the container the screen was reached through, and the search
// criteria only filter within it: they carry the search string, the property set, the provider
// selection, and none of those choose a store.
//
// This spec asserts that invariant through the screen's own web flow, as an administrator of one site,
// by asking the selector for candidates twice on one live flow execution: once as the UI issues the
// search, and once with a site key of a different site named in the request. Both legs are the same
// transition in the same session, so they differ by exactly one request parameter.
//
// Non-vacuity: the first leg IS the positive control. It must list the administered site's user and
// must NOT list the other site's, so a selector that had stopped listing anything, or a read-back
// looking at the wrong response, takes it red too. The two stores hold differently-named users, so
// neither leg can be satisfied by the other's data. Read the response body, not the status: both legs
// answer 200. Opaque by design.
import { createSite, deleteSite, createUser, deleteUser, grantRoles } from '@jahia/cypress'
import { generateRandomID } from '../../utils/utils'
import { SiteSettingsGroups } from '../../page-object/siteSettingsGroups'

describe('Manage Groups - candidate-member store', () => {
    const uniq = generateRandomID().replace(/[^a-z0-9]/gi, '')
    const siteAdministered = 'candA' + uniq
    const siteOther = 'candB' + uniq

    // one user per site store, distinctly named so a read-back cannot be ambiguous
    const userAdministered = 'candalpha' + uniq
    const userOther = 'candbravo' + uniq

    // the actor: a global principal administering siteAdministered ONLY
    const actor = 'candadmin' + uniq
    const group = 'candgroup' + uniq

    const languages = 'en'
    const templateSet = 'templates-system'

    before(() => {
        createSite(siteAdministered, { languages, templateSet, serverName: `${siteAdministered}.local`, locale: 'en' })
        createSite(siteOther, { languages, templateSet, serverName: `${siteOther}.local`, locale: 'en' })

        // each site's own store gets its own user. The title is set to the username so the rendered
        // display name and the assertion below are the same string.
        cy.executeGroovy('groovy/createSiteUserWithTitle.groovy', {
            SITE_KEY: siteAdministered,
            USER_NAME: userAdministered,
            PASSWORD: 'password',
            TITLE_VALUE: userAdministered,
        })
        cy.executeGroovy('groovy/createSiteUserWithTitle.groovy', {
            SITE_KEY: siteOther,
            USER_NAME: userOther,
            PASSWORD: 'password',
            TITLE_VALUE: userOther,
        })
        cy.executeGroovy('groovy/createSiteGroup.groovy', { SITE_KEY: siteAdministered, GROUP_NAME: group })

        // the actor is global, and administers exactly one of the two sites
        createUser(actor, 'password', [{ name: 'j:firstName', value: 'cand' }])
        grantRoles(`/sites/${siteAdministered}`, ['site-administrator'], actor, 'USER')
    })

    after(() => {
        deleteUser(actor)
        deleteSite(siteAdministered)
        deleteSite(siteOther)
    })

    // Harvest the LIVE flow action from the candidate view the browser reached, then re-issue the
    // selector's own search transition over cy.request in the same session. This is how the realm spec
    // drives a transition it needs to vary: the browser solves the JS/iframe navigation, the request
    // controls the parameters.
    const searchCandidates = (extra: Record<string, string>) =>
        cy
            .get('#searchForm')
            .invoke('attr', 'action')
            .then((action) =>
                cy.request({
                    method: 'POST',
                    url: (action as string).replace(/&amp;/g, '&'),
                    form: true,
                    body: { _eventId_search: '', searchString: '*', searchIn: 'allProps', ...extra },
                }),
            )

    beforeEach(() => {
        cy.login(actor, 'password')
        SiteSettingsGroups.visit(siteAdministered)
        cy.get(`a:contains(${group})`).click()
        cy.get('[name="_eventId_editGroupMembers"], a[href="#addUsers"]').first().click()
        cy.get('#searchForm').should('exist')
    })

    it('positive control: offers the administered site store', () => {
        searchCandidates({}).then((res) => {
            expect(res.body as string, 'the administered store must be offered').to.contain(userAdministered)
            expect(res.body as string, 'another site must not be offered').not.to.contain(userOther)
        })
    })

    it('a request-supplied site key does not move the store off the administered site', () => {
        searchCandidates({ siteKey: siteOther }).then((res) => {
            expect(res.body as string, 'a request must not select another site store').not.to.contain(userOther)
        })
    })
})
