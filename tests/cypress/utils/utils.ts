export const generateRandomID = () => {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9)
}

// The Origin header of a request to Jahia. An Origin is a scheme and a host, so the context path that
// baseUrl carries on a Jahia deployed under a context such as /dx is not part of it.
export const jahiaOrigin = () => new URL(Cypress.config().baseUrl as string).origin
