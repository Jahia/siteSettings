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

    verifyUserNameNotDisplayed(text: string) {
        cy.contains('td', text).should('not.exist')
        return this
    }

    /* The Remove action of a member row. The member is identified by a 'u:<user path>' key held by
     * the onclick, hence the anchor on the path end. Guarded by a native confirm(), auto-accepted
     * by Cypress. Removal re-renders the group view. */
    removeMember(username: string) {
        cy.get(`button[name="_eventId_removeMembers"][onclick*="/${username}')"]`).click()
        return this
    }
}
