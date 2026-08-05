// Render scope of the site settings components. A component's access rule should travel with the
// component and hold on every render path, regardless of where the component is placed — not only on the
// settings template that normally hosts it. This spec places one of these components in an ordinary
// content area and asserts that its web flow is served only to a caller that administers the resource.
//
// What this spec asserts, and what it deliberately does NOT. The invariant under test is whether the
// component's flow is SERVED. It does not assert that driving the flow to completion creates an account:
// since the screens were bound to the realm of their container, a placement outside a site or the global
// settings node resolves no realm and the creation paths decline for EVERY caller, administrator or not.
// That is a separate, independently tested control, and asserting it here would be vacuous — it would
// hold whether or not this component's own condition worked.
//
// Non-vacuity: each negative assertion is paired with a POSITIVE CONTROL that goes through the exact same
// request shape and asserts the flow IS served and its creation form IS reachable. A fixture that simply
// renders nothing, or a driver that posts the wrong shape, therefore cannot produce a false green. Both
// accepted permissions get their own control: with only the site-scoped one asserted, the server-wide
// permission could be wrong and this spec would stay green while server administrators were refused.
// A first test also proves the low-privilege session is authenticated and can read the page it renders,
// so a refusal is a refusal and not a read failure.
//
// Fully self-contained: creates its own site, the two administrators, the low-privilege user and the
// placed component in before(); tears everything down in after().
import { createSite, deleteSite, createUser, deleteUser, grantRoles, addNode } from '@jahia/cypress'
import { generateRandomID } from '../utils/utils'

describe('Site settings components - render scope', () => {
    const uniq = generateRandomID().replace(/[^a-z0-9]/gi, '')
    const site = 'renderScope' + uniq

    const siteAdmin = 'renderscopeadmin' + uniq // administers the site
    const serverAdmin = 'renderscopesrvadmin' + uniq // administers the whole server
    const lowPriv = 'renderscopelow' + uniq // ordinary account, administers nothing

    // the settings component, placed OUTSIDE the settings container
    const placed = 'placedManageUsers' + uniq
    const area = `/sites/${site}/home/pagecontent`
    // the page that hosts it — this is the URL that gets rendered
    const pageUrl = `/cms/render/default/en/sites/${site}/home.html`

    before(() => {
        createSite(site, { languages: 'en', templateSet: 'templates-system', serverName: 'localhost', locale: 'en' })

        createUser(siteAdmin, 'password', [{ name: 'j:firstName', value: 'admin' }])
        createUser(serverAdmin, 'password', [{ name: 'j:firstName', value: 'srvadmin' }])
        createUser(lowPriv, 'password', [{ name: 'j:firstName', value: 'low' }])

        // the administrator administers this site; the low-privilege user only gets to read/edit content
        grantRoles(`/sites/${site}`, ['site-administrator'], siteAdmin, 'USER')
        grantRoles(`/sites/${site}`, ['editor'], lowPriv, 'USER')
        // granted at the root, so this caller holds the server-wide permission — the condition's other
        // accepted one — on the site that is the main resource of the render below. It also needs to be able
        // to READ the hosting page, or its control would measure the site's read ACL and not the component.
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
        deleteUser(lowPriv)
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

    // Renders the hosting page as whoever is logged in and tries to advance the component's flow one
    // transition. Resolves to the number of flow execution keys the render served, and whether the
    // creation form behind the first transition was reachable.
    const driveFlow = () =>
        render(pageUrl).then((body) => {
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

    it('serves the placed component to the site administrator (positive control)', () => {
        cy.login(siteAdmin, 'password')
        driveFlow().then((outcome: { served: number; reached: boolean }) => {
            expect(outcome.served, 'the administrator must still be served the flow').to.be.greaterThan(0)
            expect(outcome.reached, 'the administrator must still reach the creation form').to.be.true
        })
    })

    it('serves the placed component to the server administrator (positive control)', () => {
        cy.login(serverAdmin, 'password')
        driveFlow().then((outcome: { served: number; reached: boolean }) => {
            expect(outcome.served, 'the server administrator must still be served the flow').to.be.greaterThan(0)
            expect(outcome.reached, 'the server administrator must still reach the creation form').to.be.true
        })
    })

    it('serves nothing for a caller that administers nothing', () => {
        cy.login(lowPriv, 'password')
        driveFlow().then((outcome: { served: number; reached: boolean }) => {
            expect(outcome.served, 'no flow may be served to a caller that administers nothing').to.eq(0)
            expect(outcome.reached, 'the creation form must not be reachable').to.be.false
        })
    })
})
