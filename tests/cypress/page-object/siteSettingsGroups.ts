import { SiteSettingsPage } from './siteSettingsPage'
import { GroupCreationPage } from './groupCreationPage'
import { GroupMembersPage } from './groupMembersPage'

export class SiteSettingsGroups extends SiteSettingsPage {
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

    verifyGroupNotListed(groupname: string) {
        cy.contains('td a', groupname).should('not.exist')
        return this
    }

    /* The Remove action of a group row. Anchored on href + the group key held by the onclick, so it
     * stays independent of the UI locale. Guarded by a native confirm(), auto-accepted by Cypress. */
    deleteGroupByName(groupname: string) {
        cy.get(`a[href="#delete"][onclick*="/${groupname}'"]`).click()
        return this
    }

    startGroupCreation() {
        cy.get('[name="_eventId_createGroup"]').click()
        return new GroupCreationPage()
    }

    /* The Copy action of a group row, anchored on href + the group key held by the onclick. */
    startGroupCopy(groupname: string) {
        cy.get(`a[href="#copy"][onclick*="/${groupname}'"]`).click()
        return new GroupCreationPage()
    }

    /* The group list is a DataTables table: its search box filters the rows client-side. */
    filter(text: string) {
        cy.get('input[aria-controls="manageGroups"]').clear()
        if (text) {
            cy.get('input[aria-controls="manageGroups"]').type(text)
        }
        return this
    }

    verifyGroupListed(groupname: string) {
        cy.contains('td a', groupname).should('be.visible')
        return this
    }
}
