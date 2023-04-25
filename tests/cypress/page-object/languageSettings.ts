export class LanguageSettings {
    static visit(siteKey: string, language: string): void {
        cy.visit(`/cms/editframe/default/${language}/sites/${siteKey}.manageLanguages.html`)
    }

    public switchReplaceUntranslatedWithDefault() {
        cy.get('label[for="mixLanguages"]').find('span.checkbox-material').click()
    }

    public submitChanges() {
        cy.get('button[id="updateSite_button"]').click()
    }
}
