// The frame of the Manage Users screen in the administration shell, for the specs of e2e/Users.
//
// The shell prefixes the frame URL with contextJsParameters.contextPath (registerRoutes.js), so the selector
// matches the end of src: an exact match finds no frame on a Jahia deployed under a context such as /dx.
const MANAGE_USERS_FRAME = '[src$="/cms/adminframe/default/en/settings.manageUsers.html"]'

// The frame of the Manage Users screen, once it has loaded: the first open of the screen goes through it.
export const manageUsersFrame = () => cy.iframe(MANAGE_USERS_FRAME)

/* The body of the frame. Each step of the chain is a query, so a retry reads the document again: a body
 * captured while a submit re-renders the frame would stay empty. */
export const frameBody = (selector: string = MANAGE_USERS_FRAME) => cy.get(selector).its('0.contentDocument.body')
