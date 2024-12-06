import { BasePage } from '@jahia/cypress'

export class UserCreationPage extends BasePage {
    setUsername(username: string) {
        cy.get('[id="username"]').type(username)
        return this
    }
    setFirstname(firstName: string) {
        cy.get('[id="firstName"]').type(firstName)
        return this
    }

    setLastname(lastName: string) {
        cy.get('[id="lastName"]').type(lastName)
        return this
    }

    setPassword(password: string) {
        cy.get('[id="password"]').type(password)
        return this
    }

    setPasswordConfirm(password: string) {
        cy.get('[id="passwordConfirm"]').type(password)
        return this
    }
    save() {
        cy.get('[name="_eventId_add"]').click()
    }
}
