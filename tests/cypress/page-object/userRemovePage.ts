import { BasePage } from '@jahia/cypress'

/* The "Export or Remove" view of a user of the Manage Users site settings screen: a read-only
 * recap of the user with an Export link and a delete action guarded by a confirmation modal. */
export class UserRemovePage extends BasePage {
    /* Every profile field of this view is a read-only recap and must be disabled. */
    verifyAllFieldsDisabled() {
        cy.get('input.form-control').each(($el) => {
            cy.wrap($el).should('be.disabled')
        })
        return this
    }

    /* The Export link must point to the export archive of that very user. */
    verifyExportLink(username: string) {
        cy.get('a.pull-right')
            .filter('[href*="/cms/export/"]')
            .should('have.attr', 'href')
            .and('include', `/${username}.zip`)
        return this
    }

    /* Trigger the confirmation modal and confirm - deletion returns to the user list. */
    delete() {
        cy.get('button[data-target="#confirmDeleteModal"]').click()
        // the modal is faded in by bootstrap, wait for the transition to be over before confirming
        cy.get('#confirmDeleteModal').should('be.visible')
        cy.get('#confirmDeleteModal [name="_eventId_confirm"]').click()
        return this
    }
}
