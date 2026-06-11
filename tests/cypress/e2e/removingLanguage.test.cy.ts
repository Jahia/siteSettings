import { SiteSettingsLanguages } from '../page-object'
import { createSite, deleteSite } from '@jahia/cypress'
describe('Language deactivation test', () => {
    const siteKey = 'siteSettingsSite'
    const languages = ['en', 'fr', 'de']

    before(function () {
        createSite(siteKey, {
            languages: languages.join(','),
            templateSet: 'dx-base-demo-templates',
            serverName: 'localhost',
            locale: 'en',
        })
        cy.apollo({
            variables: {
                pathOrId: '/sites/' + siteKey + '/home',
            },
            mutationFile: 'graphql/createContent.graphql',
        })
    })

    after(function () {
        deleteSite(siteKey)
    })

    it('Should be able to deactivate a non-mandatory language', () => {
        cy.login()

        // Go to site settings and languages edit mode
        const siteSettingsLanguages = SiteSettingsLanguages.visit(siteKey)

        // Remove active (live & edit) for the non-mandatory French language
        if (siteSettingsLanguages.isLanguageActivateForTargetMode('fr', 'live', 'active').should('eq', true)) {
            siteSettingsLanguages.deActivateLanguageForTargetMode('fr', 'live')
        }
        if (siteSettingsLanguages.isLanguageActivateForTargetMode('fr', 'edit', 'inactiveInLive').should('eq', true)) {
            siteSettingsLanguages.deActivateLanguageForTargetMode('fr', 'edit')
        }

        // Verify that the French language has been deactivated
        siteSettingsLanguages.isLanguageActivateForTargetMode('fr', 'live', 'active').should('eq', false)
        siteSettingsLanguages.close()
        siteSettingsLanguages.isLanguageActivateForTargetMode('fr', 'edit', 'active').should('eq', false)
        siteSettingsLanguages.close()

        // Verify that we cannot access to the homepage in French in EDIT workspace
        cy.visit('/cms/render/default/fr/sites/' + siteKey + '/home.html', { failOnStatusCode: false })
        cy.request({
            url: '/cms/render/default/fr/sites/' + siteKey + '/home.html',
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(404)
        })

        // Verify that we cannot access to the homepage in French in LIVE workspace
        cy.visit('/fr/sites/' + siteKey + '/home.html', { failOnStatusCode: false })
        cy.request({
            url: '/fr/sites/' + siteKey + '/home.html',
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(404)
        })
    })
})
