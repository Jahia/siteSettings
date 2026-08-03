import { BasePage } from '@jahia/cypress'

/* The "Edit" view of a user of the Manage Users site settings screen. */
export class UserEditPage extends BasePage {
    setFirstname(firstName: string) {
        cy.get('#firstName').clear()
        cy.get('#firstName').type(firstName)
        return this
    }

    setLastname(lastName: string) {
        cy.get('#lastName').clear()
        cy.get('#lastName').type(lastName)
        return this
    }

    setEmail(email: string) {
        cy.get('#email').clear()
        cy.get('#email').type(email)
        return this
    }

    setOrganization(organization: string) {
        cy.get('#organization').clear()
        cy.get('#organization').type(organization)
        return this
    }

    verifyEmail(email: string) {
        cy.get('#email').invoke('val').should('eq', email)
        return this
    }

    verifyOrganization(organization: string) {
        cy.get('#organization').should('have.value', organization)
        return this
    }

    verifyPreferredLanguage(language: string) {
        cy.get('#preferredLanguage').should('have.value', language)
        return this
    }

    /* Submitting the update returns to the user list. */
    update() {
        cy.get('[name="_eventId_update"]').click()
        return this
    }
}
