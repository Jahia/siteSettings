import { BasePage } from '@jahia/cypress'

/* A page of the site settings flows, which report the outcome of an action in a Bootstrap alert. */
export class SiteSettingsPage extends BasePage {
    verifySuccessMessage(text: string) {
        cy.contains('.alert-success', text).should('be.visible')
        return this
    }
}
