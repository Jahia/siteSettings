import { createSite, deleteSite } from '@jahia/cypress'
import { SiteSettingsModules } from '../../page-object/siteSettingsModules'

describe('Site settings - Modules', () => {
    const siteKey = 'ssModulesSite'

    before(function () {
        deleteSite(siteKey)

        createSite(siteKey, {
            languages: 'en',
            templateSet: 'templates-system',
            serverName: 'localhost',
            locale: 'en',
        })
    })

    after(function () {
        deleteSite(siteKey)
    })

    beforeEach(function () {
        cy.login()
    })

    afterEach(function () {
        cy.logout()
    })

    it('should display the modules enabled on the site', () => {
        const modules = SiteSettingsModules.visit(siteKey)

        modules.verifyTitle(siteKey)

        modules.verifySectionWithModules('Modules')
        modules.verifySectionWithModules('Required dependent modules')

        modules.verifyModuleListed('assets', 'Jahia Static Assets')
        modules.verifyModuleListed('default', 'Default Jahia Templates')
        modules.verifyModuleListed('linkchecker', 'Jahia Link Checker')
        modules.verifyModuleListed('siteSettings', 'Jahia Site Settings')
        modules.verifyModuleListed('graphql-dxm-provider', 'Jahia GraphQL Core Provider')
    })
})
