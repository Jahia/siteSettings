import { BasePage } from '@jahia/cypress'
import { UserCreationPage } from './userCreationPage'
import { BulkUserCreationPage } from './bulkUserCreationPage'
import { UserEditPage } from './userEditPage'
import { UserRemovePage } from './userRemovePage'
import { BulkUserDeletionPage } from './bulkUserDeletionPage'

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

    /* Tick the row checkbox of a user. The checkbox value is the user path, so anchor on its end.
     * The material theme hides the native input behind its own styling, hence the forced check. */
    selectUser(username: string) {
        cy.get(`input.userCheckbox[value$="/${username}"]`).check({ force: true })
        cy.get(`input.userCheckbox[value$="/${username}"]`).should('be.checked')
        return this
    }

    /* The "Remove selected users" button: deletes the users ticked with selectUser().
     * It leads to a recap view listing them and asking for confirmation. */
    removeSelectedUsers() {
        cy.get('[onclick="doUsersAction(\'bulkDeleteUser\')"]').click()
        return new BulkUserDeletionPage()
    }

    startBulkUserCreation() {
        cy.get('[onclick="doUserAction(\'bulkAddUser\')"]').click()
        return new BulkUserCreationPage()
    }

    verifyUserNameDisplayed(text: string) {
        return cy.get('body').contains('td', text).should('be.visible')
    }

    /* Search the users of the site. Enter is not submitting the form, so click the search button. */
    search(term: string) {
        cy.get('#searchString').clear()
        cy.get('#searchString').type(term)
        cy.get('[name="_eventId_search"]').first().click()
        return this
    }

    verifyUserListed(username: string) {
        cy.contains('td a', username).should('exist')
        return this
    }

    verifyUserNotListed(username: string) {
        cy.contains('td a', username).should('not.exist')
        return this
    }

    /* The action buttons of a row carry the user path in their onclick, the trailing quote
     * anchors the match on the whole user name (and not on a longer name starting with it). */
    openUserForEdit(username: string) {
        cy.get(`a[title="Edit"][href="#edit"][onclick*="/${username}'"]`).click()
        return new UserEditPage()
    }

    openExportOrRemove(username: string) {
        cy.get(`a[title="Export or Remove"][href="#delete"][onclick*="/${username}'"]`).click()
        return new UserRemovePage()
    }
}
