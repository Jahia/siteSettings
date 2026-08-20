import { createSite, deleteSite } from '@jahia/cypress'
import { generateRandomID } from '../../utils/utils'
import { SiteSettingsModules } from '../../page-object/siteSettingsModules'

describe('Site settings - Modules', () => {
    const SITE_KEY_PREFIX = 'ssModules'
    const siteKey = SITE_KEY_PREFIX + generateRandomID().replace(/[^a-z0-9]/gi, '')

    before(function () {
        cy.executeGroovy('groovy/deleteSitesByPrefix.groovy', { SITE_KEY_PREFIX: SITE_KEY_PREFIX })

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

        // The site is created with its key as title, so the heading names the site by its key.
        modules.verifyTitle(siteKey)

        modules.verifySectionWithModules('Modules')
        modules.verifySectionWithModules('Required dependent modules')

        // A sample of the rows, not the whole list: the full set follows what the instance has
        // installed, which is not what this test is about. These four are Jahia's own system
        // modules, enabled on every site, plus the module that renders this very screen.
        modules.verifyModuleListed('assets', 'Jahia Static Assets')
        modules.verifyModuleListed('default', 'Default Jahia Templates')
        modules.verifyModuleListed('linkchecker', 'Jahia Link Checker')
        modules.verifyModuleListed('siteSettings', 'Jahia Site Settings')
    })
})
