import { BasePage } from '@jahia/cypress'
import { UserCreationPage } from './userCreationPage'

export class SiteSettingsUsers extends BasePage {
    static visit(siteKey: string): SiteSettingsUsers {
        cy.visit(`/cms/editframe/default/en/sites/${siteKey}.manageUsers.html`)
        return new SiteSettingsUsers()
    }

    startUserCreation() {
        cy.get('[onclick="doUserAction(\'addUser\')"]').click()
        return new UserCreationPage()
    }

    verifyUserNameDisplayed(text: string) {
        return cy.get('body').contains('td', text).should('be.visible')
    }
}
