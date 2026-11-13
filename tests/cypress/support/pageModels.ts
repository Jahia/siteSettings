// Shared helper for the Page Models administration specs.
//
// Opens the Page Models screen for a site and reloads until the planted page-model row surfaces. The row
// is populated by a JCR-SQL2 query served from Oak's async index, which lags a fresh plant by a few
// seconds and exposes no deterministic client-side signal to wait on; the reloads are paced until the
// planted row's own path appears in the table. `handlerFlag` is the window property the caller asserts on:
// it is reset to undefined before each load so the check reflects only the current render.
//
// `view` selects one of the two sibling content-templates siteSettings registers for this screen. Both emit
// the same #pageModelsTable id and the same escaped fields, so one fixture serves both. Outside the table
// they differ: the anthracite template adds a page header and a div.panel > div.panel-body wrapper, loads
// its own DataTables initializer, and places its empty-list alert before the row loop.
//
// The visit passes jahia.ui.theme=default. Without it a logged-in session resolves the theme to
// jahia-anthracite, and the theme override `<view>-jahia-anthracite` sends both views to the anthracite
// template. With it, neither `<view>-default` exists, so each view falls back to its own template.
export type PageModelsView = 'page-models' | 'page-models-jahia-anthracite'

const MAX_ATTEMPTS = 10

export const openPageModelsUntilRow = (
    siteKey: string,
    plantedName: string,
    handlerFlag: string,
    view: PageModelsView = 'page-models',
    attempt = 0,
): Cypress.Chainable => {
    const plantedPath = `/sites/${siteKey}/${plantedName}`
    cy.visit(`/cms/editframe/default/en/sites/${siteKey}.${view}.html?jahia.ui.theme=default`, {
        onBeforeLoad(win) {
            ;(win as unknown as Record<string, unknown>)[handlerFlag] = undefined
        },
    })
    // return the chain so the caller's assertions are queued strictly after the retries
    return cy.get('#pageModelsTable tbody', { timeout: 10000 }).then(($tbody) => {
        if ($tbody.text().includes(plantedPath)) {
            return
        }
        if (attempt >= MAX_ATTEMPTS) {
            throw new Error(
                `page-model row (${plantedPath}) never appeared in the Page Models list after ${attempt + 1} loads`,
            )
        }
        // deliberate pacing: the row is served from Oak's async index, which has no deterministic
        // client-side signal to wait on.
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(3000)
        return openPageModelsUntilRow(siteKey, plantedName, handlerFlag, view, attempt + 1)
    })
}

// Only the anthracite template wraps the table in div.panel-body, which tells which template answered.
export const assertPageModelsView = (view: PageModelsView): void => {
    cy.get('.panel-body #pageModelsTable').should(view === 'page-models' ? 'not.exist' : 'exist')
}
