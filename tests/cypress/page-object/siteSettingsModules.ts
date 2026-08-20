import { BasePage } from '@jahia/cypress'

export class SiteSettingsModules extends BasePage {
    static visit(siteKey: string): SiteSettingsModules {
        cy.visit(`/cms/editframe/default/en/sites/${siteKey}.manageModules.html`)
        return new SiteSettingsModules()
    }

    verifyTitle(siteDisplayName: string) {
        cy.contains('h2', `Modules - ${siteDisplayName}`).should('be.visible')
        return this
    }

    verifySection(title: string) {
        cy.contains('h3', title).should('be.visible')
        return this
    }

    verifyModuleListed(moduleName: string) {
        cy.contains('td strong', moduleName).should('be.visible')
        return this
    }
}
