import { BaseComponent, Button, getComponentByRole, getComponentBySelector } from '@jahia/cypress'

export class LanguageSettings {
    static visit(siteKey: string): void {
        cy.visit(`/jahia/administration/${siteKey}/settings/languages`)
    }

    public switchReplaceUntranslatedWithDefault() {
        getComponentByRole(Button, 'edit').click()
        getComponentBySelector(BaseComponent, 'input[type="radio"][value="only"]').should('be.visible').click()
    }

    public submitChanges() {
        getComponentByRole(Button, 'save').click()
    }
}
