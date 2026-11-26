// The frame of the Manage Users screen in the administration shell, for the specs of e2e/Users.
//
// The shell prefixes the frame URL with contextJsParameters.contextPath (registerRoutes.js), so the selector
// matches the end of src: an exact match finds no frame on a Jahia deployed under a context such as /dx.
const MANAGE_USERS_FRAME = '[src$="/cms/adminframe/default/en/settings.manageUsers.html"]'

// The frame of the Manage Users screen, once it has loaded: the first open of the screen goes through it.
export const manageUsersFrame = () => cy.iframe(MANAGE_USERS_FRAME)

/* The body of the frame, once its document has loaded. The returned chain holds queries alone, so a retry
 * reads the document again: a body captured while a submit re-renders the frame would stay empty. An
 * assertion inside that chain would stop the requery, which is why the load waits in a chain of its own. */
export const frameBody = () => {
    cy.get(MANAGE_USERS_FRAME).its('0.contentDocument.readyState').should('eq', 'complete')
    return cy.get(MANAGE_USERS_FRAME).its('0.contentDocument.body')
}
