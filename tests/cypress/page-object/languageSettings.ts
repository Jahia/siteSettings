export class LanguageSettings {

    static visit(siteKey: string, language: string):void {
        cy.visit(`/cms/editframe/default/${language}/sites/${siteKey}.manageLanguages.html`);
    }

    public SwitchReplaceUntranslatedWithDefault() {
            cy.get('label[for="mixLanguages"]').find('span.checkbox-material').click();
    }

    public SubmitChanges() {
            cy.get('button[id="updateSite_button"]').click();
    }
}