import { BasePage, Button, getComponentBySelector } from '@jahia/cypress'

export class SiteSettingsLanguages extends BasePage {
    static visit(siteKey: string): SiteSettingsLanguages {
        cy.visit('/cms/editframe/default/en/sites/' + siteKey + '.manageLanguages.html')
        return new SiteSettingsLanguages()
    }

    isLanguageActivateForTargetMode(lang: string, mode: string) {
        const activeMode = 'active' + mode.charAt(0).toUpperCase() + mode.slice(1)
        return cy
            .get('tbody[id="siteLanguagesBody"] td.ng-binding')
            .contains('(' + lang + ')')
            .parent('tr')
            .find('input[ng-model="siteLocale.' + activeMode + '"]')
            .should('exist')
            .then(($el) => {
                return $el.hasClass('ng-not-empty')
            })
    }

    deActivateLanguageForTargetMode(lang: string, mode: string) {
        const activeMode = 'active' + mode.charAt(0).toUpperCase() + mode.slice(1)
        cy.get('tbody[id="siteLanguagesBody"] td.ng-binding')
            .contains('(' + lang + ')')
            .parent('tr')
            .find('input[ng-model="siteLocale.' + activeMode + '"]')
            .click({ force: true })
    }

    save() {
        getComponentBySelector(Button, '[id="updateSite_button"]').click()
    }
}
