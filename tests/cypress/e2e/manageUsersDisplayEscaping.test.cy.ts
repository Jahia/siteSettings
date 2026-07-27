// Regression test: user display names containing special characters must render as inert TEXT in
// the Manage Users administration screen (they must not become live DOM/HTML). Opaque by design.
// Fully self-contained (CI-ready): creates its own site + a SITE user (via a groovy fixture whose
// jcr:title carries markup) in before(), tears the site down in after(). Data setup lives in the
// cypress framework; the UI part only asserts what is rendered.
import { createSite, deleteSite } from '@jahia/cypress'

describe('Manage Users - display name rendering', () => {
    const SITE = 'manageUsersEscapingSite'
    const USER = 'displaynameuser'
    const REMOVED_USER = 'removaltargetuser'
    const PAYLOAD = '<img src=x onerror=window.__sec064fired=1>'
    const REMOVED_PAYLOAD = '<img src=x onerror=window.__markupExecuted=1>'

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
            PASSWORD: 'DisplayNamePass123!',
            TITLE_VALUE: PAYLOAD,
        }).then((raw) => {
            if (String(raw ?? '').includes('.failed')) {
                throw new Error(`createSiteUserWithTitle failed: ${raw}`)
            }
        })
        // a second user, deleted by the removal test below, so the listing test keeps its own subject
        cy.executeGroovy('groovy/createSiteUserWithTitle.groovy', {
            USER_NAME: REMOVED_USER,
            SITE_KEY: SITE,
            PASSWORD: 'DisplayNamePass123!',
            TITLE_VALUE: REMOVED_PAYLOAD,
        }).then((raw) => {
            if (String(raw ?? '').includes('.failed')) {
                throw new Error(`createSiteUserWithTitle failed: ${raw}`)
            }
        })
    })

    after(() => {
        deleteSite(SITE)
    })

    it('renders a display name containing markup as literal text (no active element, no handler fires)', () => {
        cy.login()
        cy.visit(`/cms/editframe/default/en/sites/${SITE}.manageUsers.html`, {
            onBeforeLoad(win) {
                ;(win as unknown as Record<string, unknown>).__sec064fired = undefined
            },
        })

        // drive the real search form to list our user
        cy.get('#searchString').clear()
        cy.get('#searchString').type(USER)
        cy.get('[name="_eventId_search"]').first().click()

        // the display name must appear as escaped literal text in a table cell
        cy.contains('td', PAYLOAD, { timeout: 10000 }).should('be.visible')
        // and must NOT have become a live <img> element carrying an onerror handler
        cy.get('td img[onerror]').should('not.exist')

        // definitive live check: the onerror handler must never have executed (by the time the cell
        // above has rendered as visible text, any onerror would already have fired).
        cy.window().then((win) => {
            expect((win as unknown as Record<string, unknown>).__sec064fired, 'the onerror handler must not fire').to.be
                .undefined
        })
    })

    it('reports the removal of a user whose display name contains markup as literal text', () => {
        cy.login()
        cy.visit(`/cms/editframe/default/en/sites/${SITE}.manageUsers.html`, {
            onBeforeLoad(win) {
                ;(win as unknown as Record<string, unknown>).__markupExecuted = undefined
            },
        })

        cy.get('#searchString').clear()
        cy.get('#searchString').type(REMOVED_USER)
        cy.get('[name="_eventId_search"]').first().click()

        // drive the real removal: the row action leads to the confirmation view-state, whose confirm
        // button posts the delete. force: true because one settings skin nests it in a modal.
        cy.get('a[href="#delete"]', { timeout: 10000 }).first().click()
        cy.get('[name="_eventId_confirm"]', { timeout: 10000 }).first().click({ force: true })

        // back on the listing, the confirmation message must show the display name as literal text
        cy.contains('.alert', REMOVED_PAYLOAD, { timeout: 10000 }).should('be.visible')
        // and must not have turned it into a live element carrying a handler
        cy.get('.alert img[onerror]').should('not.exist')

        cy.window().then((win) => {
            expect((win as unknown as Record<string, unknown>).__markupExecuted, 'the onerror handler must not fire').to
                .be.undefined
        })
    })
})
