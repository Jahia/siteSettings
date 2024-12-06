import { BasePage } from '@jahia/cypress'

export class GroupMembersPage extends BasePage {
    startAddUsers() {
        cy.get('[name="_eventId_editGroupMembers"]').click()
        return this
    }

    addUsersToSelection(username: string) {
        cy.contains(username).parent().find('[class="checkbox"]').click()
        return this
    }

    save() {
        cy.get('[id="saveButton"]').click()
    }

    verifyUserNameDisplayed(text: string) {
        return cy.get('body').contains('td', text).should('be.visible')
    }
}
