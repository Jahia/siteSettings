// Regression test: a page-model's path is also emitted inside HTML attributes on the Page Models
// administration screen (the module-hook <div>'s path="..." and the row link href="..."), not only as
// visible link text. Those attribute occurrences must stay confined to their attribute value even when
// the underlying node name carries reserved markup characters including a double quote — the character
// that would otherwise close the attribute and let the remaining text be parsed as its own element.
// Fully self-contained (CI-ready): creates its own site + a template-model page whose node NAME carries
// the markup in before(), tears the site down in after().
import { createSite, deleteSite } from '@jahia/cypress'

describe('Manage Page Models - path attribute rendering', () => {
    const SITE = 'pageModelsAttrEscapingSite'
    const SITE_PATH = `/sites/${SITE}`
    // The node name flows into the "page path" attributes. It leads with a double quote so that, if the
    // value reached the attribute unescaped, the quote would close path="..."/href="..." and the trailing
    // markup would be parsed as a live <img> whose onerror flips a window flag we assert never ran. A node
    // name cannot contain '/', so the value is slash-free.
    const MARKUP = '"><img src=x onerror=window.__pageModelsAttrHandlerFired=1>'

    before(() => {
        createSite(SITE, {
            languages: 'en',
            templateSet: 'templates-system',
            serverName: 'localhost',
            locale: 'en',
        })
        // the name is passed base64-encoded: it contains a double quote, which would otherwise terminate
        // the fixture's own groovy string literal when the token is substituted in.
        cy.executeGroovy('groovy/createPageModelWithEncodedName.groovy', {
            SITE_KEY: SITE,
            MARKUP_NAME_B64: btoa(MARKUP),
        }).then((raw) => {
            if (String(raw ?? '').includes('.failed')) {
                throw new Error(`createPageModelWithEncodedName failed: ${raw}`)
            }
        })
    })

    after(() => {
        deleteSite(SITE)
    })

    // Open the Page Models admin screen and reload until the planted page-model surfaces in the list.
    // The row is populated by a JCR-SQL2 query served from Oak's async index, which lags a fresh plant
    // by a few seconds; without this the list can render empty and the assertions would be vacuous.
    const MAX_ATTEMPTS = 10
    const openUntilRowPresent = (attempt = 0): Cypress.Chainable => {
        cy.visit(`/cms/editframe/default/en/sites/${SITE}.page-models.html`, {
            onBeforeLoad(win) {
                ;(win as unknown as Record<string, unknown>).__pageModelsAttrHandlerFired = undefined
            },
        })
        // return the chain so the caller's assertions are queued strictly after the retries
        return cy.get('#pageModelsTable tbody', { timeout: 10000 }).then(($tbody) => {
            if ($tbody.text().includes(SITE_PATH)) {
                return
            }
            if (attempt >= MAX_ATTEMPTS) {
                throw new Error(
                    `page-model row (${SITE_PATH}) never appeared in the Page Models list after ${attempt + 1} loads`,
                )
            }
            // deliberate pacing: the row is served from Oak's async index, which has no
            // deterministic client-side signal to wait on.
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(3000)
            return openUntilRowPresent(attempt + 1)
        })
    }

    it('keeps a page-model path containing markup inside its attribute (no active element, no handler fires)', () => {
        cy.login()
        openUntilRowPresent()

        // the path renders as inert literal text in its link cell, quote and trailing markup included
        cy.contains('#pageModelsTable a', MARKUP, { timeout: 10000 }).should('be.visible')

        // the markup must NOT have escaped an attribute to become a live <img> element with a handler
        cy.get('#pageModelsTable img[onerror]').should('not.exist')

        // definitive live check: the onerror handler must never have executed (by the time the row above
        // has rendered, any breakout <img> would already have fired).
        cy.window().then((win) => {
            expect(
                (win as unknown as Record<string, unknown>).__pageModelsAttrHandlerFired,
                'the onerror handler must not fire',
            ).to.be.undefined
        })
    })
})
