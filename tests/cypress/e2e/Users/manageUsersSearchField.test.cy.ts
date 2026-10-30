// Asserts that the search field of Manage Users shows the searched text as typed once the search has
// run. Self-contained: creates its own site in before(), tears it down in after().
//
// The `.manageUsers.html` route renders the settingsBootstrap3GoogleMaterialStyle view variant; the test
// asserts that marker on the search form so its coverage is pinned to that variant.
import { createSite, deleteSite } from '@jahia/cypress'
import { SiteSettingsUsers } from '../../page-object/siteSettingsUsers'

describe('Manage Users - search field', () => {
    const SITE = 'manageUsersSearchFieldSite'
    const PAGE_MARKER = '__userSearchPageBeforeSubmit'

    const searchAndReadBack = (text: string) => {
        SiteSettingsUsers.visit(SITE)
        cy.get('#searchForm').should('have.attr', 'action').and('include', 'settingsBootstrap3GoogleMaterialStyle')
        cy.get('#searchString').clear()
        cy.get('#searchString').type(text, { delay: 0 })
        cy.window().then((win) => {
            ;(win as unknown as Record<string, unknown>)[PAGE_MARKER] = true
        })
        cy.get('[name="_eventId_search"]').first().click()
        // the search reloads the page, which drops the marker
        cy.window({ timeout: 10000 }).should((win) => {
            expect((win as unknown as Record<string, unknown>)[PAGE_MARKER], 'page reloaded').to.be.undefined
        })
        return cy.get('#searchString')
    }

    before(() => {
        createSite(SITE, {
            languages: 'en',
            templateSet: 'templates-system',
            serverName: 'localhost',
            locale: 'en',
        })
    })

    after(() => {
        deleteSite(SITE)
    })

    beforeEach(() => {
        cy.login()
    })

    it('shows a plain search text as typed', () => {
        searchAndReadBack('root').should('have.value', 'root')
    })

    it('shows a search text with quotes, an ampersand, angle brackets and accents as typed', () => {
        const text = `zoé & <o'brien> "qa" l'été`
        searchAndReadBack(text).should('have.value', text)
    })
})
