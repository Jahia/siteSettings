import { BasePage, Button, Dropdown, getComponent, getComponentByRole, Menu, Table } from '@jahia/cypress'

export class SiteSettingsLanguages extends BasePage {
    static visit(siteKey: string): SiteSettingsLanguages {
        cy.visit(`/jahia/administration/${siteKey}/settings/languages`)
        return new SiteSettingsLanguages()
    }

    isLanguageActivateForTargetMode(lang: string, mode: string, expectedValue: string) {
        getComponent(Table)
            .get()
            .find(`span.moonstone-pill:contains('${lang}')`)
            .parentsUntil('tr')
            .parent()
            .find('button')
            .last()
            .click()
        getComponent(Menu).select('Edit')
        return getComponentByRole(Dropdown, 'availability')
            .get()
            .then(($el) => {
                return $el.attr('data-value') === expectedValue
            })
    }

    deActivateLanguageForTargetMode(lang: string, mode: string) {
        getComponentByRole(Dropdown, 'availability').select(mode === 'live' ? 'Inactive in live' : 'Inactive')
        getComponentByRole(Button, 'save').click()
    }

    close() {
        getComponentByRole(Button, 'cancel').click()
    }
}
