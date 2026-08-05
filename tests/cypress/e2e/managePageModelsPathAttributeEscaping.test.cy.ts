// Asserts a page-model's path renders as an inert attribute value on the Page Models administration
// screen. The path is emitted inside HTML attributes on each row (the module-hook <div>'s path="..." and
// the row link href="..."), not only as visible link text, and must stay confined to its attribute value
// even when the underlying node name contains reserved markup characters including a double quote.
// Self-contained (CI-ready): creates its own site + a template-model page whose node NAME carries the
// markup in before(), tears the site down in after().
import { createSite, deleteSite } from '@jahia/cypress'
import { openPageModelsUntilRow } from '../support/pageModels'

describe('Manage Page Models - path attribute rendering', () => {
    const SITE = 'pageModelsAttrEscapingSite'
    // The node name flows into the "page path" attributes. It leads with a double quote and carries an
    // <img onerror=...> so that, were it to reach an attribute value unescaped, the onerror would run and
    // flip a window flag; the assertions below confirm it stays inert. A node name cannot contain '/', so
    // the value is slash-free.
    const MARKUP = '"><img src=x onerror=window.__pageModelsAttrHandlerFired=1>'

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

    it('keeps a page-model path containing markup inside its attribute (no active element, no handler fires)', () => {
        cy.login()
        openPageModelsUntilRow(SITE, '__pageModelsAttrHandlerFired')

        // the path renders as inert literal text in its link cell, quote and trailing markup included
        cy.contains('#pageModelsTable a', MARKUP, { timeout: 10000 }).should('be.visible')

        // the markup must remain confined to the attribute value — no standalone <img> element with a handler
        cy.get('#pageModelsTable img[onerror]').should('not.exist')

        // definitive live check: the onerror handler must never have executed (by the time the row above
        // has rendered, any element that had escaped the attribute would already have fired).
        cy.window().then((win) => {
            expect(
                (win as unknown as Record<string, unknown>).__pageModelsAttrHandlerFired,
                'the onerror handler must not fire',
            ).to.be.undefined
        })
    })
})
