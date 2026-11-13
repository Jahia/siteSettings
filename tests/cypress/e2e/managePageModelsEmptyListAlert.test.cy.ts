// Asserts the "No item found" alert of the Page Models administration screen appears only when the site
// has no page model (#323): with at least one page model the alert must be gone, with none it must show.
// Self-contained (CI-ready): creates its own sites in before() — one with a planted page model, one
// without — and tears them down in after().
//
// Runs against both content-templates siteSettings registers for this screen (default and
// settingsBootstrap3GoogleMaterialStyle): the two JSPs are maintained as separate files, so a fix or a
// regression in one does not imply the other. The alert block of the anthracite template renders before
// its row loop, which is what showed the alert above a non-empty list until #323.
import { createSite, deleteSite } from '@jahia/cypress'
import { openPageModelsUntilRow, PAGE_MODELS_VIEWS } from '../support/pageModels'

describe('Manage Page Models - empty-list alert', () => {
    const SITE_WITH_MODEL = 'pageModelsAlertWithModelSite'
    const SITE_WITHOUT_MODEL = 'pageModelsAlertWithoutModelSite'
    // A plain node name is all the with-model case needs; the fixture takes it base64-encoded so it
    // could carry any character a JCR name allows.
    const MODEL_NAME = 'homeModel'

    before(() => {
        createSite(SITE_WITH_MODEL, {
            languages: 'en',
            templateSet: 'templates-system',
            serverName: 'localhost',
            locale: 'en',
        })
        createSite(SITE_WITHOUT_MODEL, {
            languages: 'en',
            templateSet: 'templates-system',
            serverName: 'localhost',
            locale: 'en',
        })
        cy.executeGroovy('groovy/createPageModelWithEncodedName.groovy', {
            SITE_KEY: SITE_WITH_MODEL,
            MARKUP_NAME_B64: btoa(MODEL_NAME),
        }).then((raw) => {
            if (String(raw ?? '').includes('.failed')) {
                throw new Error(`createPageModelWithEncodedName failed: ${raw}`)
            }
        })
    })

    after(() => {
        deleteSite(SITE_WITH_MODEL)
        deleteSite(SITE_WITHOUT_MODEL)
    })

    PAGE_MODELS_VIEWS.forEach((view) => {
        // the default view keeps its original title, which TestRail and incident dedup key on
        const noAlertTitle = 'shows no empty-list alert above a list that has page models'
        it(view === 'page-models' ? noAlertTitle : `${noAlertTitle} [${view}]`, () => {
            cy.login()
            // wait until the planted row surfaces: until then the list may honestly read empty
            openPageModelsUntilRow(SITE_WITH_MODEL, MODEL_NAME, '__pageModelsEmptyListProbe', view)
            cy.get('.alert-info').should('not.exist')
        })

        const alertTitle = 'shows the empty-list alert when the site has no page model'
        it(view === 'page-models' ? alertTitle : `${alertTitle} [${view}]`, () => {
            cy.login()
            // no row can ever surface here, so a single load settles the screen
            cy.visit(`/cms/editframe/default/en/sites/${SITE_WITHOUT_MODEL}.${view}.html?jahia.ui.theme=default`)
            cy.get('#pageModelsTable tbody', { timeout: 10000 }).should('exist')
            // only the anthracite template wraps the table in div.panel-body, which tells which template answered
            cy.get('.panel-body #pageModelsTable').should(view === 'page-models' ? 'not.exist' : 'exist')
            // no row count is asserted: DataTables draws its own "no data" row client-side on an empty table
            cy.get('.alert-info').should('be.visible')
        })
    })
})
