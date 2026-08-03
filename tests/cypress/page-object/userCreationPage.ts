import { BasePage } from '@jahia/cypress'

export class UserCreationPage extends BasePage {
    setUsername(username: string) {
        // usernames may legitimately contain '{'/'}' - do not let Cypress read them as key sequences
        cy.get('[id="username"]').type(username, { parseSpecialCharSequences: false })
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

    setEmail(email: string) {
        cy.get('#email').type(email)
        return this
    }

    setOrganization(organization: string) {
        cy.get('#organization').type(organization)
        return this
    }

    setPreferredLanguage(language: string) {
        cy.get('#preferredLanguage').select(language)
        return this
    }

    save() {
        cy.get('[name="_eventId_add"]').click()
        return this
    }

    /* On a rejected creation the form is re-rendered with the validation message. */
    verifyErrorMessage(message: string) {
        cy.get('.alert-danger').should('contain', message)
        return this
    }
}
