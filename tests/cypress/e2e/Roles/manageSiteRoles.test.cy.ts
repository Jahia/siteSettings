// Membership of site roles through Site settings > Site roles: a user of the site made site
// administrator, and a user added to a custom site role. Migrated from the Selenium class
// CustomSiteRoleTest (Jahia/selenium#1644).
import { addNode, context, createSite, createUser, deleteNode, deleteSite, deleteUser, jfaker } from '@jahia/cypress'
import { SiteSettingsRoles } from '../../page-object/siteSettingsRoles'

describe('Site roles - role membership', () => {
    const prefix = 'siteroles'
    const uniq = jfaker.string.alphanumeric({ length: 8, casing: 'lower', safe: true })
    const siteKey = prefix + uniq

    const siteUser = prefix + 'siteuser' + uniq
    const globalUser = prefix + 'global' + uniq
    const customRole = prefix + 'publishers' + uniq

    before(() => {
        cy.executeGroovy('groovy/deleteStaleFixtures.groovy', { PREFIX: prefix })
        createSite(siteKey, { languages: 'en', templateSet: 'templates-system', serverName: 'localhost', locale: 'en' })
        cy.executeGroovy('groovy/createSiteUserWithTitle.groovy', {
            USER_NAME: siteUser,
            SITE_KEY: siteKey,
            PASSWORD: 'password',
            TITLE_VALUE: siteUser,
        })
        createUser(globalUser, 'password')
        addNode({
            parentPathOrId: '/roles',
            name: customRole,
            primaryNodeType: 'jnt:role',
            properties: [
                { name: 'j:roleGroup', type: 'STRING', value: 'site-role' },
                { name: 'j:permissionNames', type: 'STRING', values: ['publish'] },
            ],
        })
    })

    beforeEach(() => {
        cy.login()
    })

    after(() => {
        deleteSite(siteKey)
        deleteUser(globalUser)
        deleteNode(`/roles/${customRole}`)
    })

    it('gives the site-administrator role to a user of the site', () => {
        context.tag('admin', 'roles', 'site-admin-site-user', 'testrail-case-2213943')
        const roles = SiteSettingsRoles.visit(siteKey)
        roles.verifyNotUserMember('site-administrator', siteUser)
        roles.editMembers('site-administrator').search(siteUser).selectCandidate(siteUser).save()
        roles.verifyUserMember('site-administrator', siteUser)
    })

    it('adds a user to a custom site role', () => {
        context.tag('admin', 'roles', 'custom-role-member', 'testrail-case-2213943')
        const roles = SiteSettingsRoles.visit(siteKey)
        roles.verifyRoleListed(customRole).verifyNotUserMember(customRole, globalUser)
        roles.editMembers(customRole).search(globalUser).selectCandidate(globalUser).save()
        roles.verifyUserMember(customRole, globalUser)
    })
})
