// Render scope of the site settings components. A settings component renders from the settings template
// that declares its access rule, for a caller who holds that rule on the resource the request is made
// against. This spec asserts both halves: the flow of a component placed in an ordinary content area is
// served to no caller, and the flow of the same screen reached through its settings route is served to the
// administrators the template's own requirement names — including a role that names that requirement
// directly rather than through an ancestor permission.
//
// What this spec asserts, and what it deliberately does NOT. The invariant under test is whether the
// component's flow is SERVED. It does not assert that driving the flow to completion creates an account:
// since the screens were bound to the realm of their container, a placement outside a site or the global
// settings node resolves no realm and the creation paths decline for EVERY caller, administrator or not.
// That is a separate, independently tested control, and asserting it here would be vacuous — it would hold
// whether or not this component's own condition worked.
//
// Non-vacuity: the negative assertions and the positive control go through the same detector and the same
// request shape, and the control drives one transition further to the creation form. A fixture that simply
// renders nothing, or a driver that posts the wrong shape, therefore cannot produce a false green. A first
// test proves the low-privilege session is authenticated and can read the page it renders, so a refusal is
// a refusal and not a read failure. The screen-scoped role asserts its own grants through hasPermission
// before rendering anything, so that test measures the render condition and not a mis-built fixture.
//
// Fully self-contained: creates its own site, the administrators, the screen-scoped role, the low-privilege
// user and the placed component in before(); tears everything down in after().
import { createSite, deleteSite, createUser, deleteUser, grantRoles, addNode, deleteNode } from '@jahia/cypress'
import { generateRandomID } from '../utils/utils'

describe('Site settings components - render scope', () => {
    const uniq = generateRandomID().replace(/[^a-z0-9]/gi, '')
    const site = 'renderScope' + uniq

    const siteAdmin = 'renderscopeadmin' + uniq // administers the site
    const serverAdmin = 'renderscopesrvadmin' + uniq // administers the whole server
    const scopedAdmin = 'renderscopescoped' + uniq // administers one screen of the site
    const lowPriv = 'renderscopelow' + uniq // ordinary account, administers nothing

    // A site-administration role that names the groups screen's own permission directly, alongside the
    // permissions any site administrator needs to reach the administration route. It deliberately does NOT
    // name the ancestor permission that aggregates the per-screen ones, which is what makes it the case a
    // per-screen requirement has to keep working for.
    const scopedRole = 'renderscopegroupsonly' + uniq
    const scopedRolePermissions = [
        'siteAdministrationAccess',
        'siteAdminGroups',
        'components',
        'jContent',
        'managers',
        'jcr:all_default',
        'wysiwyg-editor-toolbar',
    ]

    // the settings component, placed OUTSIDE the settings container
    const placed = 'placedManageUsers' + uniq
    const area = `/sites/${site}/home/pagecontent`
    // the page that hosts it — this is the URL that gets rendered
    const pageUrl = `/cms/render/default/en/sites/${site}/home.html`
    // the same screens reached through the settings route that declares their requirement
    const settingsUsersUrl = `/cms/editframe/default/en/sites/${site}.manageUsers.html`
    const settingsGroupsUrl = `/cms/editframe/default/en/sites/${site}.manageGroups.html`

    before(() => {
        createSite(site, { languages: 'en', templateSet: 'templates-system', serverName: 'localhost', locale: 'en' })

        createUser(siteAdmin, 'password', [{ name: 'j:firstName', value: 'admin' }])
        createUser(serverAdmin, 'password', [{ name: 'j:firstName', value: 'srvadmin' }])
        createUser(scopedAdmin, 'password', [{ name: 'j:firstName', value: 'scoped' }])
        createUser(lowPriv, 'password', [{ name: 'j:firstName', value: 'low' }])

        addNode({
            parentPathOrId: '/roles',
            primaryNodeType: 'jnt:role',
            name: scopedRole,
            properties: [
                { name: 'j:roleGroup', value: 'site-role' },
                { name: 'j:privilegedAccess', value: 'true' },
                { name: 'j:permissionNames', values: scopedRolePermissions },
            ],
        })

        // the administrator administers this site; the low-privilege user only gets to read/edit content
        grantRoles(`/sites/${site}`, ['site-administrator'], siteAdmin, 'USER')
        grantRoles(`/sites/${site}`, [scopedRole], scopedAdmin, 'USER')
        grantRoles(`/sites/${site}`, ['editor'], lowPriv, 'USER')
        // granted at the root, so this caller administers the server. It also needs to be able to READ the
        // hosting page, or its render would measure the site's read ACL and not the component.
        grantRoles('/', ['server-administrator'], serverAdmin, 'USER')
        grantRoles(`/sites/${site}`, ['editor'], serverAdmin, 'USER')

        // an ordinary content area on the home page, then the settings component inside it
        addNode({ parentPathOrId: `/sites/${site}/home`, primaryNodeType: 'jnt:contentList', name: 'pagecontent' })
        addNode({ parentPathOrId: area, primaryNodeType: 'jnt:siteSettingsManageUsers', name: placed })
    })

    after(() => {
        cy.login()
        deleteUser(siteAdmin)
        deleteUser(serverAdmin)
        deleteUser(scopedAdmin)
        deleteUser(lowPriv)
        deleteNode(`/roles/${scopedRole}`)
        deleteSite(site)
    })

    // ---- driving the component the way its own screen does ----

    // The action URL of the screen's hidden users form carries the flow execution key; without a
    // served flow there is no such form and nothing can be driven.
    const usersFormAction = (body: string): string | null => {
        const forms = body.match(/<form[^>]*>/g) || []
        const form = forms.find((f) => f.includes('usersForm'))
        const action = form && form.match(/action="([^"]+)"/)
        return action ? action[1].replace(/&amp;/g, '&') : null
    }

    const formContaining = (body: string, needle: string): string | null => {
        const forms = body.match(/<form[^>]*>[\s\S]*?<\/form>/g) || []
        return forms.find((f) => f.includes(needle)) ?? null
    }

    const render = (url: string) =>
        cy
            .request({ url, failOnStatusCode: false, qs: { ec: generateRandomID() } })
            .then((res) => (typeof res.body === 'string' ? res.body : ''))

    // Renders a URL as whoever is logged in and tries to advance the users component's flow one transition.
    // Resolves to the number of flow execution keys the render served, and whether the creation form behind
    // the first transition was reachable.
    const driveFlow = (url: string) =>
        render(url).then((body) => {
            const served = (body.match(/webflowexecution/g) || []).length
            const action = usersFormAction(body)
            if (!action) {
                return cy.wrap({ served, reached: false })
            }
            return cy
                .request({
                    method: 'POST',
                    url: action,
                    form: true,
                    failOnStatusCode: false,
                    body: { _eventId: 'addUser' },
                })
                .then((res) => {
                    const createForm = formContaining(typeof res.body === 'string' ? res.body : '', 'name="username"')
                    return cy.wrap({ served, reached: createForm !== null })
                })
        })

    const flowsServed = (url: string) => render(url).then((body) => (body.match(/webflowexecution/g) || []).length)

    const holdsPermission = (path: string, permission: string) =>
        cy
            .request({
                method: 'POST',
                url: '/modules/graphql',
                headers: { Origin: Cypress.config().baseUrl as string },
                body: {
                    query: `{jcr(workspace:EDIT){nodeByPath(path:"${path}"){hasPermission(permissionName:"${permission}")}}}`,
                },
            })
            .then((res) => res.body?.data?.jcr?.nodeByPath?.hasPermission as boolean)

    it('the low-privilege session is authenticated and can read the hosting page', () => {
        cy.login(lowPriv, 'password')
        cy.request({
            method: 'POST',
            url: '/modules/graphql',
            headers: { Origin: Cypress.config().baseUrl as string },
            body: { query: '{currentUser{name}}' },
        }).then((res) => {
            expect(res.body?.data?.currentUser?.name, 'the driving session must be the low-privilege account').to.eq(
                lowPriv,
            )
        })
        cy.request({ url: pageUrl, qs: { ec: generateRandomID() } }).then((res) => {
            expect(res.status, 'the low-privilege account must be able to read the hosting page').to.eq(200)
        })
    })

    it('serves the screen on its settings route to the site administrator (positive control)', () => {
        cy.login(siteAdmin, 'password')
        driveFlow(settingsUsersUrl).then((outcome: { served: number; reached: boolean }) => {
            expect(outcome.served, 'the administrator must be served the flow on the settings route').to.be.greaterThan(
                0,
            )
            expect(outcome.reached, 'the administrator must reach the creation form').to.be.true
        })
    })

    it('serves the screen on its settings route to a role naming that screen only', () => {
        cy.login(scopedAdmin, 'password')
        holdsPermission(`/sites/${site}`, 'siteAdminGroups').then((held) => {
            expect(held, 'the fixture role must grant the groups screen its own permission').to.be.true
        })
        holdsPermission(`/sites/${site}`, 'site-admin').then((held) => {
            expect(held, 'the fixture role must not grant the ancestor permission').to.be.false
        })
        flowsServed(settingsGroupsUrl).then((served) => {
            expect(served, 'a role naming the screen must be served that screen').to.be.greaterThan(0)
        })
    })

    it('serves the placed component to no site administrator', () => {
        cy.login(siteAdmin, 'password')
        driveFlow(pageUrl).then((outcome: { served: number; reached: boolean }) => {
            expect(outcome.served, 'no flow may be served from an ordinary content area').to.eq(0)
            expect(outcome.reached, 'the creation form must not be reachable').to.be.false
        })
    })

    it('serves the placed component to no server administrator', () => {
        cy.login(serverAdmin, 'password')
        driveFlow(pageUrl).then((outcome: { served: number; reached: boolean }) => {
            expect(outcome.served, 'no flow may be served from an ordinary content area').to.eq(0)
            expect(outcome.reached, 'the creation form must not be reachable').to.be.false
        })
    })

    it('serves the placed component to no caller that administers nothing', () => {
        cy.login(lowPriv, 'password')
        driveFlow(pageUrl).then((outcome: { served: number; reached: boolean }) => {
            expect(outcome.served, 'no flow may be served from an ordinary content area').to.eq(0)
            expect(outcome.reached, 'the creation form must not be reachable').to.be.false
        })
    })
})
