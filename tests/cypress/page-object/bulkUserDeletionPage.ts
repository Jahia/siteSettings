import { BasePage } from '@jahia/cypress'

/* The recap view reached from the "Remove" button of the Manage Users screen: it lists the users
 * selected through their row checkbox and deletes them all on confirmation. */
export class BulkUserDeletionPage extends BasePage {
    /* The users about to be deleted are listed, pre-checked, in the recap table. */
    verifyUserListed(username: string) {
        cy.contains('td', username).should('be.visible')
        return this
    }

    confirm() {
        cy.get('[name="_eventId_confirm"]').click()
        return this
    }
}
