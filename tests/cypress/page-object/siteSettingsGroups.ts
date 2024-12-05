import { BasePage } from '@jahia/cypress'
import { GroupCreationPage } from './groupCreationPage'
import { GroupMembersPage } from './groupMembersPage'

export class SiteSettingsGroups extends BasePage {
    static visit(siteKey: string): SiteSettingsGroups {
        cy.visit(`/cms/editframe/default/en/sites/${siteKey}.manageGroups.html`)
        return new SiteSettingsGroups()
    }
    openGroupByName(groupname: string) {
        cy.get(`a:contains(${groupname})`).click()
        return new GroupMembersPage()
    }

    verifyGroupNameDisplayed(text: string) {
        return cy.get('body').contains('td', text).should('be.visible')
    }

    startGroupCreation() {
        cy.get('[name="_eventId_createGroup"]').click()
        return new GroupCreationPage()
    }
}
