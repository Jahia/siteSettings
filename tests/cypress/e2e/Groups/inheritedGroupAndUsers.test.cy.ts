/**
 * Here the group structure for each test:
 * groupA contains:
 *      user1, user2 (direct members)
 *      groupB (direct member)
 *      Indirectly: user3, user4 (via groupB)
 *      Indirectly: groupC (via groupB)
 *
 * groupB contains:
 *      user3, user4 (direct members)
 *      groupC (direct member)
 *
 * groupC contains no members.
 */
describe('Inherited groups and users for a given group', () => {
    beforeEach('Create users and groups', () => {
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

    it('Should not allow to add itself', () => {
        cy.login()
        cy.visit('/cms/adminframe/default/en/settings.manageGroups.html')
        cy.contains('a', 'groupA').click()
        // Edit memberShip
        cy.get('button[name="_eventId_editGroupMembers"]').click()
        // Edit groups
        cy.contains('a', 'Groups').click()
        // Add a groupA to groupC (as groupC belongs to groupA)
        cy.get('input[type="checkbox"][value="/groups/groupA"]').click({ force: true })
        cy.get('#saveButton').click()
        // groupA should NOT belong to groupC
        cy.contains('td', 'groupA').should('not.exist')
    })

    it('Should Not allow circular group inheritance', () => {
        cy.login()
        cy.visit('/cms/adminframe/default/en/settings.manageGroups.html')
        cy.contains('a', 'groupC').click()
        // Edit memberShip
        cy.get('button[name="_eventId_editGroupMembers"]').click()
        // Edit groups
        cy.contains('a', 'Groups').click()
        // Add a groupA to groupC (as groupC belongs to groupA)
        cy.get('input[type="checkbox"][value="/groups/groupA"]').click({ force: true })
        cy.get('#saveButton').click()
        // groupA should NOT belong to groupC
        cy.contains('td', 'groupA').should('not.exist')
    })

    it('Should allow adding direct members already in an inherited group', () => {
        cy.login()
        cy.visit('/cms/adminframe/default/en/settings.manageGroups.html')
        cy.contains('a', 'groupA').click()
        // Check that user3 does not belong to groupA
        cy.contains('td', 'user3').should('not.exist')
        // Edit users
        cy.get('button[name="_eventId_editGroupMembers"]').click()
        // Add a user3 to groupA (that belongs to groupB, a member of groupA)
        cy.get('input[type="checkbox"][value="/users/gi/if/fh/user3"]').click({ force: true })
        cy.get('#saveButton').click()
        // user3 should belong to groupA
        cy.contains('td', 'user3').should('exist')
    })
})
