// The Origin header of a request to Jahia. An Origin is a scheme and a host, so the context path that
// baseUrl carries on a Jahia deployed under a context such as /dx is not part of it.
export const jahiaOrigin = () => new URL(Cypress.config().baseUrl as string).origin
