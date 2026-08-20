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

        modules.verifySection('Modules')
        modules.verifySection('Required dependent modules')

        modules.verifyModuleListed('Jahia Static Assets')
        modules.verifyModuleListed('Default Jahia Templates')
        modules.verifyModuleListed('Jahia Link Checker')
        modules.verifyModuleListed('Jahia Site Settings')
        modules.verifyModuleListed('Jahia GraphQL Core Provider')
    })
})
