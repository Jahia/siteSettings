// Asserts a page-model's path renders as inert TEXT in the Page Models administration screen (it must
// stay text, not become live DOM/HTML), including when the underlying node name contains reserved markup
// characters. Self-contained (CI-ready): creates its own site + a template-model page whose node NAME
// carries markup in before(), tears the site down in after().
import { createSite, deleteSite } from '@jahia/cypress'
import { openPageModelsUntilRow } from '../support/pageModels'

describe('Manage Page Models - path rendering', () => {
    const SITE = 'pageModelsEscapingSite'
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
        // the name is passed base64-encoded so it can carry any character a JCR name allows.
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

    it('renders a page-model path containing markup as literal text (no active element, no handler fires)', () => {
        cy.login()
        openPageModelsUntilRow(SITE, '__pageModelsPathHandlerFired')

        // the path must appear as escaped literal text inside its link cell
        cy.contains('a', MARKUP, { timeout: 10000 }).should('be.visible')
        // and must stay text — no standalone <img> element carrying an onerror handler
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
