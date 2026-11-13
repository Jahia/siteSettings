import { BasePage } from '@jahia/cypress'

export class GroupCreationPage extends BasePage {
    setGroupname(groupname: string) {
        cy.get('[name="groupname"]').type(groupname)
        return this
    }
    save() {
        cy.get('[name="_eventId_add"]').click()
        return this
    }

    /* The copy form is the creation form, submitted through its own event. */
    copy() {
        cy.get('[name="_eventId_copy"]').click()
        return this
    }

    replaceGroupname(groupname: string) {
        cy.get('[name="groupname"]').clear()
        if (groupname) {
            cy.get('[name="groupname"]').type(groupname)
        }
        return this
    }

    cancel() {
        cy.get('[name="_eventId_cancel"]').click()
    }

    /* The form lists the naming rules in a note, so the error is read from its alert only. */
    verifyError(text: string) {
        cy.contains('.alert-danger', text).should('be.visible')
        return this
    }
}
