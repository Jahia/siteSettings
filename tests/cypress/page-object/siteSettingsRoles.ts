import { SiteSettingsPage } from './siteSettingsPage'

/* Site settings > Site roles: the jnt:manageRoles flow of the default module, with roleGroup="site-role".
 * Each role is a panel whose member table and Edit button carry the role key in data-sel-role. */
export class SiteSettingsRoles extends SiteSettingsPage {
    static visit(siteKey: string): SiteSettingsRoles {
        cy.visit(`/cms/editframe/default/en/sites/${siteKey}.manageSiteRoles.html`)
        return new SiteSettingsRoles()
    }

    verifyRoleListed(role: string) {
        cy.get(`[data-sel-role="grantRole-${role}"]`).should('be.visible')
        return this
    }

    editMembers(role: string) {
        cy.get(`[data-sel-role="grantRole-${role}"]`).click()
        return new RoleMembersPage()
    }

    /* A member row of the role, anchored on the id of its revoke button: '<u|g>:<principal name>_<role>'. */
    verifyUserMember(role: string, username: string) {
        cy.get(`table[data-sel-role="${role}-users"]`)
            .find(`a.revokeRoleButton[id="u:${username}_${role}"]`)
            .should('exist')
        return this
    }

    verifyNotUserMember(role: string, username: string) {
        cy.get(`table[data-sel-role="${role}-users"]`)
            .find(`a.revokeRoleButton[id="u:${username}_${role}"]`)
            .should('not.exist')
        return this
    }
}

/* The member picker of a role. Saving ends the flow, which renders the role list again. */
export class RoleMembersPage extends SiteSettingsPage {
    search(text: string) {
        cy.get('#searchString').clear()
        cy.get('#searchString').type(text)
        cy.get('#searchForm [name="_eventId_search"]').click()
        return this
    }

    /* A candidate row, identified by the principal name its checkbox holds. The styled checkbox hides
     * its input, so the click goes to the label that wraps it. */
    selectCandidate(principalName: string) {
        cy.get(`input.selectedMember[value="${principalName}"]`).closest('label').click()
        return this
    }

    save() {
        cy.get('#saveButton').should('not.be.disabled').click()
        return new SiteSettingsRoles()
    }
}
