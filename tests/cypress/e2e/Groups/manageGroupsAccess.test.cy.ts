// What membership of a site group grants: the role of the group, the site administration of the
// built-in site-administrators group, and nothing on another site.
//
// The legacy class checked access by opening Page Composer, which Jahia 8 no longer ships. Edit
// access is read here from the edit frame that jContent loads (/cms/editframe), which answers 200
// to a user who may edit the site and 404 to one who may not. Every refusal is paired with a user
// who gets 200 on the same URL, so a 404 never stands for a page that does not exist.
import { context, createSite, createUser, deleteSite, deleteUser, grantRoles, jfaker } from '@jahia/cypress'
import { SiteSettingsGroups } from '../../page-object/siteSettingsGroups'

describe('Manage Groups - access granted by group membership', () => {
    const prefix = 'mgaccess'
    const uniq = jfaker.string.alphanumeric({ length: 8, casing: 'lower', safe: true })
    const siteKey = prefix + uniq
    const otherSiteKey = prefix + 'other' + uniq
    const password = 'password'

    // editors: members of a group that holds editor-in-chief on the site
    const editorsGroup = 'editors' + uniq
    const globalEditor = prefix + 'editor' + uniq
    const siteEditor = 'siteeditor' + uniq
    // site administrators added through the screen
    const globalAdmin = prefix + 'admin' + uniq
    const siteAdmin = 'siteadmin' + uniq
    // a user who belongs to no group of the site
    const outsider = prefix + 'outsider' + uniq
    // a group holding a role on the site, deleted by the deletion test
    const deletedGroup = 'deleted' + uniq

    const editFrame = (site: string) => `/cms/editframe/default/en/sites/${site}/home.html`
    const manageGroups = (site: string) => `/cms/editframe/default/en/sites/${site}.manageGroups.html`

    const loginGlobalUser = (username: string) => {
        cy.logout()
        cy.login(username, password)
    }
    // a user of a site authenticates against that site
    const loginSiteUser = (username: string, site: string) => {
        cy.logout()
        cy.request({
            method: 'POST',
            url: '/cms/login',
            form: true,
            body: { username, password, site },
            followRedirect: false,
        })
            .its('status')
            .should('eq', 302)
    }
    const statusOf = (url: string) => cy.request({ url, failOnStatusCode: false }).its('status')
    const siteGroupNames = () =>
        cy
            .apollo({
                queryFile: 'graphql/getNodeChildrenNames.graphql',
                variables: { path: `/sites/${siteKey}/groups` },
            })
            .then((res) => (res?.data?.jcr?.nodeByPath?.children?.nodes || []).map((n: { name: string }) => n.name))

    before(() => {
        cy.executeGroovy('groovy/deleteStaleFixtures.groovy', { PREFIX: prefix })
        createSite(siteKey, { languages: 'en', templateSet: 'templates-system', serverName: 'localhost', locale: 'en' })
        createSite(otherSiteKey, {
            languages: 'en',
            templateSet: 'templates-system',
            serverName: 'localhost',
            locale: 'en',
        })
        ;[globalEditor, globalAdmin, outsider].forEach((user) => createUser(user, password))
        ;[siteEditor, siteAdmin].forEach((user) =>
            cy.executeGroovy('groovy/createSiteUserWithTitle.groovy', {
                USER_NAME: user,
                SITE_KEY: siteKey,
                PASSWORD: password,
                TITLE_VALUE: user,
            }),
        )

        cy.executeGroovy('groovy/createSiteGroup.groovy', { SITE_KEY: siteKey, GROUP_NAME: editorsGroup })
        cy.executeGroovy('groovy/addMemberToGroup.groovy', {
            GROUP_SITE_KEY: siteKey,
            GROUP_NAME: editorsGroup,
            MEMBER_NAME: globalEditor,
        })
        cy.executeGroovy('groovy/addSiteMemberToSiteGroup.groovy', {
            SITE_KEY: siteKey,
            GROUP_NAME: editorsGroup,
            MEMBER_NAME: siteEditor,
        })
        grantRoles(`/sites/${siteKey}`, ['editor-in-chief'], editorsGroup, 'GROUP')

        cy.executeGroovy('groovy/createSiteGroup.groovy', { SITE_KEY: siteKey, GROUP_NAME: deletedGroup })
        grantRoles(`/sites/${siteKey}`, ['editor'], deletedGroup, 'GROUP')
    })

    after(() => {
        cy.logout()
        ;[globalEditor, globalAdmin, outsider].forEach((user) => deleteUser(user))
        deleteSite(siteKey)
        deleteSite(otherSiteKey)
    })

    it('lets every member of a group edit the site the group holds a role on', () => {
        context.tag('manage-groups', 'group-role-access')
        loginGlobalUser(outsider)
        statusOf(editFrame(siteKey)).should('eq', 404)

        loginGlobalUser(globalEditor)
        statusOf(editFrame(siteKey)).should('eq', 200)

        loginSiteUser(siteEditor, siteKey)
        statusOf(editFrame(siteKey)).should('eq', 200)
    })

    // The Edit roles tab lists a role holder only while its group resolves, so the check reads the
    // group store of the site, where that resolution happens.
    it('removes a deleted group from the list and from the role holders of the site', () => {
        context.tag('manage-groups', 'delete-group-roles')
        siteGroupNames().should('include', deletedGroup)

        cy.login()
        SiteSettingsGroups.visit(siteKey)
            .deleteGroupByName(deletedGroup)
            .verifySuccessMessage(`Group '${deletedGroup}' successfully removed`)
            .verifyGroupNotListed(deletedGroup)

        // the editors group is still there, so the list read below is not an empty one
        siteGroupNames().should('include', editorsGroup).and('not.include', deletedGroup)
    })

    it('grants site administration to the users added to site-administrators', () => {
        context.tag('manage-groups', 'site-admin-membership')
        loginGlobalUser(globalAdmin)
        statusOf(manageGroups(siteKey)).should('eq', 404)

        cy.login()
        const members = SiteSettingsGroups.visit(siteKey).openGroupByName('site-administrators')
        members.startAddUsers().selectCandidate(globalAdmin).selectCandidate(siteAdmin).save()
        members.verifySuccessMessage("Group 'site-administrators' successfully updated")

        const createAndDeleteGroup = (group: string) => {
            const groups = SiteSettingsGroups.visit(siteKey)
            groups.startGroupCreation().setGroupname(group).save()
            groups.verifySuccessMessage(`Group '${group}' successfully created`)
            groups.deleteGroupByName(group).verifySuccessMessage(`Group '${group}' successfully removed`)
        }
        loginGlobalUser(globalAdmin)
        createAndDeleteGroup('byglobaladmin' + uniq)
        loginSiteUser(siteAdmin, siteKey)
        createAndDeleteGroup('bysiteadmin' + uniq)
    })

    it('refuses a user of one site the edit access to another site', () => {
        context.tag('manage-groups', 'site-user-cross-site-403')
        cy.login()
        statusOf(editFrame(otherSiteKey)).should('eq', 200)

        loginSiteUser(siteEditor, siteKey)
        statusOf(editFrame(siteKey)).should('eq', 200)
        statusOf(editFrame(otherSiteKey)).should('eq', 404)
    })
})
