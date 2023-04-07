import { SiteSettingsLanguages } from '../../page-object'
import { createSite } from '@jahia/cypress'
describe('Language deactivation test', () => {
    const siteKey = 'siteSettingsSite'
    const langEN = '"en"'
    const langFR = '"fr"'
    const langDE = '"de"'
    const languages = langEN + ',' + langFR + ',' + langDE

    before(function () {
        createSite(siteKey, null, null, null, languages)
        cy.apollo({
            variables: {
                pathOrId: '/sites/' + siteKey + '/home',
            },
            mutationFile: 'graphql/createContent.graphql',
        })
    })

    after(function () {
        cy.executeGroovy('groovy/admin/deleteSite.groovy', { SITEKEY: siteKey })
    })

    it('Should be able to deactivate a non-mandatory language', () => {
        cy.login()

        // Go to site settings and languages edit mode
        const siteSettingsLanguages = SiteSettingsLanguages.visit(siteKey)

        // Remove active (live & edit) for the non-mandatory French language
        if (siteSettingsLanguages.isLanguageActivateForTargetMode('fr', 'live').should('eq', true)) {
            siteSettingsLanguages.deActivateLanguageForTargetMode('fr', 'live')
        }
        if (siteSettingsLanguages.isLanguageActivateForTargetMode('fr', 'edit').should('eq', true)) {
            siteSettingsLanguages.deActivateLanguageForTargetMode('fr', 'edit')
        }

        // Submit changes
        siteSettingsLanguages.save()

        // Verify that the French language has been deactivated
        siteSettingsLanguages.isLanguageActivateForTargetMode('fr', 'live').should('eq', false)
        siteSettingsLanguages.isLanguageActivateForTargetMode('fr', 'edit').should('eq', false)

        // Verify that we cannot access to the homepage in French
        cy.visit('/cms/render/default/fr/sites/' + siteKey + '/home.html', { failOnStatusCode: false })
        cy.request({
            url: '/cms/render/default/fr/sites/' + siteKey + '/home.html',
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(404)
        })
    })
})
