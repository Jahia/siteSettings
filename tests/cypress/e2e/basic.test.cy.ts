describe('First cypress launch', () => {
    it('Check that basic test working.', function () {
        cy.login()
        cy.visit('/jahia/dashboard')
        cy.url().should('include', '/jahia/dashboard')
    })
})
