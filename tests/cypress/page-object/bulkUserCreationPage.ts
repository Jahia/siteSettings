import { BasePage } from '@jahia/cypress'

export class BulkUserCreationPage extends BasePage {
    setCsvFile(filePath: string) {
        cy.fixture(filePath).as('csvFileFixture')
        cy.get('#csvFile').selectFile('@csvFileFixture');
    }

    setSeparator(separator:string) {
        cy.get('#csvSeparator').clear().type(separator);
    }

    getSeparator() {
        return cy.get('#csvSeparator').invoke('val');
    }

    removeSeparatorLimit() {
        cy.get("#csvSeparator").invoke('removeAttr', 'maxlength');
    }

    save() {
        cy.get('[name="_eventId_confirm"]').click();
    }
}