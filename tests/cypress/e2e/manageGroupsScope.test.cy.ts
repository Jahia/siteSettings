// Authorization scope test for the Manage Groups administration screen. A site-scoped administrator
// (site-administrator role on a SINGLE site) may only create, copy and edit groups within that one
// administered site. This spec exercises the three mutating operations of the screen — create a group
// (addGroup), copy a group (copyGroup) and remove a member from a group (removeMembers) — and asserts
// that each one refuses a target resolved OUTSIDE the administered site while still performing the
// same operation normally on an IN-scope target. Opaque by design.
//
// Non-vacuity: every rejection case is paired with a POSITIVE CONTROL that mutates through the exact
// same channel (the real Manage Groups web flow driven in the browser). If the site-administrator
// session were silently running unauthenticated, the positive control would fail to mutate and the
// suite would go red — a no-op driver cannot produce a false green here. A dedicated first test also
// proves that the site-administrator session authenticates out-of-band requests.
//
// Fully self-contained: creates its own administered site, a second (other) site, the site
// administrator and the principals in before(); tears everything down in after().
import { createSite, deleteSite, createUser, deleteUser, grantRoles } from '@jahia/cypress'
import { generateRandomID } from '../utils/utils'
import { SiteSettingsGroups } from '../page-object/siteSettingsGroups'

describe('Manage Groups - administered-site scope', () => {
    const uniq = generateRandomID().replace(/[^a-z0-9]/gi, '')
    const adminSite = 'grpScopeAdmin' + uniq
    const otherSite = 'grpScopeOther' + uniq

    // the site-scoped administrator (administers ONLY adminSite)
    const siteAdmin = 'grpscopeadmin' + uniq

    // server-global members used to seed the two removeMembers targets
    const inScopeMember = 'grpscopeinmember' + uniq
    const globalMember = 'grpscopegmember' + uniq

    // groups
    const inScopeGroup = 'inScopeGroup' + uniq // under adminSite (removeMembers positive control + copy source list)
    const copySource = 'copySource' + uniq // under adminSite (copyGroup positive control source)
    const globalGroup = 'globalGroup' + uniq // server-global (removeMembers rejection target)
    const otherSource = 'otherSource' + uniq // under otherSite (copyGroup rejection source)

    const languages = 'en'
    const templateSet = 'templates-system'

    before(() => {
        createSite(adminSite, { languages, templateSet, serverName: 'localhost', locale: 'en' })
        createSite(otherSite, { languages, templateSet, serverName: 'localhost', locale: 'en' })

        createUser(siteAdmin, 'password', [{ name: 'j:firstName', value: 'scope' }])
        createUser(inScopeMember, 'password', [{ name: 'j:firstName', value: 'inscope' }])
        createUser(globalMember, 'password', [{ name: 'j:firstName', value: 'global' }])

        // groups of the administered site
        cy.executeGroovy('groovy/createSiteGroup.groovy', { SITE_KEY: adminSite, GROUP_NAME: inScopeGroup })
        cy.executeGroovy('groovy/createSiteGroup.groovy', { SITE_KEY: adminSite, GROUP_NAME: copySource })
        // a group owned by the OTHER site (out of scope)
        cy.executeGroovy('groovy/createSiteGroup.groovy', { SITE_KEY: otherSite, GROUP_NAME: otherSource })
        // a server-global group (out of scope)
        cy.executeGroovy('groovy/createGlobalGroup.groovy', { GROUP_NAME: globalGroup })

        // seed exactly one member in each removeMembers target
        cy.executeGroovy('groovy/addMemberToGroup.groovy', {
            GROUP_SITE_KEY: adminSite,
            GROUP_NAME: inScopeGroup,
            MEMBER_NAME: inScopeMember,
        })
        cy.executeGroovy('groovy/addMemberToGroup.groovy', {
            GROUP_SITE_KEY: 'null',
            GROUP_NAME: globalGroup,
            MEMBER_NAME: globalMember,
        })

        // the administrator is scoped to adminSite only
        grantRoles(`/sites/${adminSite}`, ['site-administrator'], siteAdmin, 'USER')
    })

    after(() => {
        deleteUser(siteAdmin)
        deleteUser(inScopeMember)
        deleteUser(globalMember)
        cy.executeGroovy('groovy/deleteGlobalGroup.groovy', { GROUP_NAME: globalGroup })
        deleteSite(adminSite)
        deleteSite(otherSite)
    })

    // ---- verification helpers ----
    // Queried out-of-band as root over GraphQL, via cy.request (a back-end HTTP call, independent of
    // the browser page and of the site administrator's session) so the checks report the true stored
    // state regardless of what the driving session was allowed to do.

    const queryRoot = (query: string) =>
        cy
            .request({
                method: 'POST',
                url: '/modules/graphql',
                headers: { Origin: Cypress.config().baseUrl as string },
                auth: { username: 'root', password: Cypress.env('SUPER_USER_PASSWORD') as string },
                body: { query },
            })
            .then((res) => res.body?.data)

    const nodePath = (type: string, name: string, under?: string) =>
        queryRoot(
            `{jcr(workspace:EDIT){q:nodesByQuery(query:"select * from [${type}] where localname()='${name}'${
                under ? ` and isdescendantnode('${under}')` : ''
            }"){nodes{path}}}}`,
        ).then((data) => (data?.jcr?.q?.nodes?.[0]?.path ?? null) as string | null)

    const memberNames = (groupPath: string) =>
        queryRoot(
            `{jcr(workspace:EDIT){nodeByPath(path:"${groupPath}"){members:descendants(typesFilter:{types:["jnt:member"]}){nodes{name}}}}}`,
        ).then((data) => (data?.jcr?.nodeByPath?.members?.nodes || []).map((n: { name: string }) => n.name))

    // ---- browser web-flow drivers (act as the site-scoped administrator) ----

    // Drive the manageGroups hidden group form to reach a view-state (editGroup / copyGroup) for an
    // arbitrary group key — exactly the request the screen's own JavaScript posts, but with a target
    // the screen would not list for a site-scoped administrator. Mirrors submitGroupForm().
    const driveGroupForm = (event: string, groupPath: string) => {
        cy.get('#groupFormAction').invoke('val', event)
        cy.get('#groupFormSelected').invoke('val', encodeURIComponent(groupPath))
        cy.get('#groupForm').submit()
    }

    it('site-scoped administrator session is authenticated for out-of-band requests', () => {
        cy.login(siteAdmin, 'password')
        cy.request({
            method: 'POST',
            url: '/modules/graphql',
            headers: { Origin: Cypress.config().baseUrl as string },
            body: { query: '{currentUser{name}}' },
        }).then((res) => {
            expect(
                res.body?.data?.currentUser?.name,
                'the driving session must actually be the site-scoped administrator',
            ).to.eq(siteAdmin)
        })
    })

    it('removeMembers: removes a member of an in-scope group (positive control)', () => {
        cy.login()
        nodePath('jnt:group', inScopeGroup, `/sites/${adminSite}`).then((groupPath) => {
            expect(groupPath, 'group must belong to the administered site').to.match(
                new RegExp(`^/sites/${adminSite}/`),
            )
            memberNames(groupPath as string).then((before: string[]) => {
                expect(before, 'baseline: member is present').to.include(inScopeMember)
            })

            cy.login(siteAdmin, 'password')
            SiteSettingsGroups.visit(adminSite)
            driveGroupForm('editGroup', groupPath as string)
            cy.get('input[name="selectedMembers"]').check({ force: true })
            cy.get('[name="_eventId_removeMembers"]').first().click()

            cy.login()
            memberNames(groupPath as string).then((after: string[]) => {
                expect(after, 'in-scope member must be removed by the site administrator').to.not.include(inScopeMember)
            })
        })
    })

    it('removeMembers: leaves a member of a server-global group untouched', () => {
        cy.login()
        nodePath('jnt:group', globalGroup, '/groups').then((groupPath) => {
            expect(groupPath, 'target must be a server-global group').to.match(/^\/groups\//)
            memberNames(groupPath as string).then((before: string[]) => {
                expect(before, 'baseline: member is present').to.include(globalMember)
            })

            cy.login(siteAdmin, 'password')
            SiteSettingsGroups.visit(adminSite)
            driveGroupForm('editGroup', groupPath as string)
            cy.get('input[name="selectedMembers"]').check({ force: true })
            cy.get('[name="_eventId_removeMembers"]').first().click()

            cy.login()
            memberNames(groupPath as string).then((after: string[]) => {
                expect(after, 'out-of-scope group member must be left untouched').to.include(globalMember)
            })
        })
    })

    it('addGroup: creates a group in the administered site (positive control)', () => {
        const newGroup = 'inScopeAdd' + generateRandomID().replace(/[^a-z0-9]/gi, '')
        cy.login(siteAdmin, 'password')
        SiteSettingsGroups.visit(adminSite)
        cy.get('[name="_eventId_createGroup"]').click()
        cy.get('#groupname').type(newGroup)
        cy.get('[name="_eventId_add"]').click()

        cy.login()
        nodePath('jnt:group', newGroup).then((path) => {
            expect(path, 'in-scope group must be created inside the administered site').to.match(
                new RegExp(`^/sites/${adminSite}/`),
            )
        })
    })

    it('addGroup: refuses to create a group targeting another site', () => {
        const newGroup = 'crossSiteAdd' + generateRandomID().replace(/[^a-z0-9]/gi, '')
        cy.login(siteAdmin, 'password')
        SiteSettingsGroups.visit(adminSite)
        cy.get('[name="_eventId_createGroup"]').click()
        cy.get('#groupname').type(newGroup)
        // craft the request so the created group would land in the other site's store
        cy.get('#groupname').then(($el: JQuery<HTMLElement>) => {
            Cypress.$('<input>', { type: 'hidden', name: 'siteKey', value: otherSite }).appendTo($el.closest('form'))
        })
        cy.get('[name="_eventId_add"]').click()

        cy.login()
        nodePath('jnt:group', newGroup).then((path) => {
            expect(path, 'no group must be created for an out-of-scope site key').to.be.null
        })
    })

    it('copyGroup: copies an in-scope group inside the administered site (positive control)', () => {
        const newGroup = 'inScopeCopy' + generateRandomID().replace(/[^a-z0-9]/gi, '')
        cy.login()
        nodePath('jnt:group', copySource, `/sites/${adminSite}`).then((sourcePath) => {
            expect(sourcePath, 'source must belong to the administered site').to.match(
                new RegExp(`^/sites/${adminSite}/`),
            )

            cy.login(siteAdmin, 'password')
            SiteSettingsGroups.visit(adminSite)
            driveGroupForm('copyGroup', sourcePath as string)
            cy.get('#groupname').clear()
            cy.get('#groupname').type(newGroup)
            cy.get('[name="_eventId_copy"]').click()

            cy.login()
            nodePath('jnt:group', newGroup).then((path) => {
                expect(path, 'in-scope copy must be created inside the administered site').to.match(
                    new RegExp(`^/sites/${adminSite}/`),
                )
            })
        })
    })

    it('copyGroup: refuses to copy from a group owned by another site', () => {
        const newGroup = 'crossSiteCopy' + generateRandomID().replace(/[^a-z0-9]/gi, '')
        cy.login()
        nodePath('jnt:group', otherSource, `/sites/${otherSite}`).then((sourcePath) => {
            expect(sourcePath, 'source must belong to the other site').to.match(new RegExp(`^/sites/${otherSite}/`))

            cy.login(siteAdmin, 'password')
            SiteSettingsGroups.visit(adminSite)
            driveGroupForm('copyGroup', sourcePath as string)
            cy.get('#groupname').clear()
            cy.get('#groupname').type(newGroup)
            cy.get('[name="_eventId_copy"]').click()

            cy.login()
            nodePath('jnt:group', newGroup).then((path) => {
                expect(path, 'no group must be copied from an out-of-scope source').to.be.null
            })
        })
    })
})
