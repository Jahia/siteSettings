import { BasePage } from '@jahia/cypress'

/* The site settings Modules screen: one table listing the modules enabled on the site, split by a
 * section marker row into the site's own modules and the ones only pulled in as dependencies. */
export class SiteSettingsModules extends BasePage {
    static visit(siteKey: string): SiteSettingsModules {
        cy.visit(`/cms/editframe/default/en/sites/${siteKey}.manageModules.html`)
        return new SiteSettingsModules()
    }

    verifyTitle(siteDisplayName: string) {
        cy.contains('h2', `Modules - ${siteDisplayName}`).should('be.visible')
        return this
    }

    /* A section header, and that the section holds at least one module: the rows following the
     * marker row are its modules, each carrying its display name in a <strong>. Matched exactly,
     * since 'Modules' is a substring of 'Required dependent modules'. */
    verifySectionWithModules(title: string) {
        cy.contains('h3', new RegExp(`^${title}$`))
            .should('be.visible')
            .parents('tr')
            .next('tr')
            .find('td strong')
            .should('not.be.empty')
        return this
    }

    /* A module row, anchored on the module id — the technical, locale-independent key of the row —
     * then reading back the display name cell. */
    verifyModuleListed(moduleId: string, moduleName: string) {
        cy.contains('td', new RegExp(`^${moduleId}$`))
            .parent()
            .find('td strong')
            .should('have.text', moduleName)
        return this
    }
}
