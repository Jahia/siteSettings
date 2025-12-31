import { BasePage } from '@jahia/cypress'
import { UserCreationPage } from './userCreationPage'
import { BulkUserCreationPage } from './bulkUserCreationPage'

export class SiteSettingsUsers extends BasePage {
    static visitGlobal() {
        cy.visit('/jahia/administration/manageUsers')
        return new SiteSettingsUsers()
    }

    static visit(siteKey: string): SiteSettingsUsers {
        cy.visit(`/cms/editframe/default/en/sites/${siteKey}.manageUsers.html`)
        return new SiteSettingsUsers()
    }

    startUserCreation() {
        cy.get('[onclick="doUserAction(\'addUser\')"]').click()
        return new UserCreationPage()
    }

    startBulkUserCreation() {
        cy.get('[onclick="doUserAction(\'bulkAddUser\')"]').click()
        return new BulkUserCreationPage()
    }

    verifyUserNameDisplayed(text: string) {
        return cy.get('body').contains('td', text).should('be.visible')
    }
}
