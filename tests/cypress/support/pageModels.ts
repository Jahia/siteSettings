// Shared helper for the Page Models administration specs.
//
// Opens the Page Models screen for a site and reloads until the planted page-model row surfaces. The row
// is populated by a JCR-SQL2 query served from Oak's async index, which lags a fresh plant by a few
// seconds and exposes no deterministic client-side signal to wait on; the reloads are paced until the
// row's site path appears in the table. `handlerFlag` is the window property the caller asserts on: it is
// reset to undefined before each load so the check reflects only the current render.
const MAX_ATTEMPTS = 10

export const openPageModelsUntilRow = (siteKey: string, handlerFlag: string, attempt = 0): Cypress.Chainable => {
    const sitePath = `/sites/${siteKey}`
    cy.visit(`/cms/editframe/default/en/sites/${siteKey}.page-models.html`, {
        onBeforeLoad(win) {
            ;(win as unknown as Record<string, unknown>)[handlerFlag] = undefined
        },
    })
    // return the chain so the caller's assertions are queued strictly after the retries
    return cy.get('#pageModelsTable tbody', { timeout: 10000 }).then(($tbody) => {
        if ($tbody.text().includes(sitePath)) {
            return
        }
        if (attempt >= MAX_ATTEMPTS) {
            throw new Error(
                `page-model row (${sitePath}) never appeared in the Page Models list after ${attempt + 1} loads`,
            )
        }
        // deliberate pacing: the row is served from Oak's async index, which has no deterministic
        // client-side signal to wait on.
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(3000)
        return openPageModelsUntilRow(siteKey, handlerFlag, attempt + 1)
    })
}
