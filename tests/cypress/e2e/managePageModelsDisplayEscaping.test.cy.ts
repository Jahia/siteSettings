// Regression test: a page-model's path shown in the Page Models administration screen must render as
// inert TEXT (it must not become live DOM/HTML), including when the underlying node name contains
// reserved markup characters. Fully self-contained (CI-ready): creates its own site + a template-model
// page whose node NAME carries markup in before(), tears the site down in after(). Data setup lives in
// the cypress framework; the UI part only asserts what is rendered.
import { createSite, deleteSite } from '@jahia/cypress'

describe('Manage Page Models - path rendering', () => {
    const SITE = 'pageModelsEscapingSite'
    const SITE_PATH = `/sites/${SITE}`
    // The node name flows into the "page path" column. A node name cannot contain '/', so this value is
    // slash-free; the onerror handler flips a window flag we can assert never ran.
    const MARKUP = '<img src=x onerror=window.__pageModelsPathHandlerFired=1>'

    before(() => {
        createSite(SITE, {
            languages: 'en',
            templateSet: 'templates-system',
            serverName: 'localhost',
            locale: 'en',
        })
        cy.executeGroovy('groovy/createPageModelWithMarkupName.groovy', {
            SITE_KEY: SITE,
            MARKUP_NAME: MARKUP,
        }).then((raw) => {
            if (String(raw ?? '').includes('.failed')) {
                throw new Error(`createPageModelWithMarkupName failed: ${raw}`)
            }
        })
    })

    after(() => {
        deleteSite(SITE)
    })

    // Open the Page Models admin screen and reload until the planted page-model surfaces in the list.
    // The row is populated by a JCR-SQL2 query served from Oak's async index, which lags a fresh plant
    // by a few seconds; without this the list can render empty and the assertions would be vacuous.
    const openUntilRowPresent = (attempt = 0) => {
        cy.visit(`/cms/editframe/default/en/sites/${SITE}.page-models.html`, {
            onBeforeLoad(win) {
                ;(win as unknown as Record<string, unknown>).__pageModelsPathHandlerFired = undefined
            },
        })
        cy.get('#pageModelsTable', { timeout: 10000 })
        cy.get('body').then(($b) => {
            const rowText = $b.find('#pageModelsTable tbody').text()
            if (!rowText.includes(SITE_PATH) && attempt < 10) {
                cy.wait(3000)
                openUntilRowPresent(attempt + 1)
            }
        })
    }

    it('renders a page-model path containing markup as literal text (no active element, no handler fires)', () => {
        cy.login()
        openUntilRowPresent()

        // the path must appear as escaped literal text inside its link cell
        cy.contains('a', MARKUP, { timeout: 10000 }).should('be.visible')
        // and must NOT have become a live <img> element carrying an onerror handler
        cy.get('td img[onerror]').should('not.exist')

        // definitive live check: the onerror handler must never have executed (by the time the link
        // above has rendered as visible text, any onerror would already have fired).
        cy.window().then((win) => {
            expect(
                (win as unknown as Record<string, unknown>).__pageModelsPathHandlerFired,
                'the onerror handler must not fire',
            ).to.be.undefined
        })
    })
})
