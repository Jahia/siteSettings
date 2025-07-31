describe('Inherited groups and users for a given group', () => {
    before('Create users and groups', () => {
        cy.executeGroovy('groovy/deleteGroups.groovy')
        cy.executeGroovy('groovy/createGroups.groovy')
    })

    it('Should not have users from inherited groups', () => {
        cy.login()
        // Check initial env
        cy.visit('/cms/adminframe/default/en/settings.manageGroups.html')
        cy.contains('a', 'groupB').click()
        // Check users
        cy.contains('td', 'user1').should('not.exist')
        cy.contains('td', 'user2').should('not.exist')
        cy.contains('td', 'user3').should('exist')
        cy.contains('td', 'user4').should('exist')
        cy.contains('td', 'groupB').should('not.exist')
        cy.contains('td', 'groupC').should('exist')

        // Test
        cy.visit('/cms/adminframe/default/en/settings.manageGroups.html')
        // Open group1
        cy.contains('a', 'groupA').click()
        // Check users
        cy.contains('td', 'user1').should('exist')
        cy.contains('td', 'user2').should('exist')
        cy.contains('td', 'user3').should('not.exist')
        cy.contains('td', 'user4').should('not.exist')
        cy.contains('td', 'groupB').should('exist')
        cy.contains('td', 'groupC').should('not.exist')
        // Edit users
        cy.get('button[name="_eventId_editGroupMembers"]').click()
        // Check users
        cy.get('input[value$="user1"]').should('be.checked')
        cy.get('input[value$="user2"]').should('be.checked')
        cy.get('input[value$="user3"]').should('not.be.checked')
        cy.get('input[value$="user4"]').should('not.be.checked')
        // Check groups
        cy.get('[data-sel-role="switchToGroupsView"]').click()
        cy.get('input[value$="groupB"]').should('be.checked')
        cy.get('input[value$="groupC"]').should('not.be.checked')
    })
})
