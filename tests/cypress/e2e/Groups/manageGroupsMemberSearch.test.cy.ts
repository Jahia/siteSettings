// Asserts that the search field of the Manage Groups member picker shows the searched text as typed once
// the search has run. Self-contained: creates its own site and group in before(), tears the site down in
// after().
//
// The `.manageGroups.html` route renders the settingsBootstrap3GoogleMaterialStyle view variant; the test
// asserts that marker so its coverage is pinned to that variant.
import { createSite, deleteSite } from '@jahia/cypress'
import { SiteSettingsGroups } from '../../page-object/siteSettingsGroups'

describe('Manage Groups - member picker search field', () => {
    const SITE = 'manageGroupsMemberSearchSite'
    const GROUP = 'membersearchgroup'
    const PAGE_MARKER = '__memberSearchPageBeforeSubmit'

    const searchAndReadBack = (text: string) => {
        SiteSettingsGroups.visit(SITE).openGroupByName(GROUP).startAddUsers()
        cy.location('href').should('include', 'settingsBootstrap3GoogleMaterialStyle')
        cy.get('#searchString').clear()
        cy.get('#searchString').type(text, { delay: 0 })
        cy.window().then((win) => {
            ;(win as unknown as Record<string, unknown>)[PAGE_MARKER] = true
        })
        cy.get('#searchForm [name="_eventId_search"]').click()
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
        cy.executeGroovy('groovy/createSiteGroup.groovy', {
            SITE_KEY: SITE,
            GROUP_NAME: GROUP,
        }).then((raw) => {
            if (String(raw ?? '').includes('.failed')) {
                throw new Error(`createSiteGroup failed: ${raw}`)
            }
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
