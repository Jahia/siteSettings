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
}
