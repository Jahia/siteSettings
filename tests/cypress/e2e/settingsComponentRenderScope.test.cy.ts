// Render scope of the site settings components. These screens are ordinary, instantiable content
// types, so the settings container they were designed for is not the only place they can be rendered
// from. This spec places one of them in a plain page content area — i.e. outside that container — and
// asserts that the web flow behind it, and the user creation it performs, are only available to a
// caller that actually administers the site. Opaque by design.
//
// Non-vacuity: every negative assertion is paired with a POSITIVE CONTROL that goes through the exact
// same request shape and asserts the flow IS served, and a user IS created, for the site
// administrator. A fixture that simply renders nothing, or a driver that posts the wrong shape,
// therefore cannot produce a false green. A first test also proves the low-privilege session is
// authenticated and can read the page it renders, so a refusal is a refusal and not a read failure.
//
// Fully self-contained: creates its own site, the site administrator, the low-privilege user and the
// placed component in before(); tears everything down in after().
import { createSite, deleteSite, createUser, deleteUser, grantRoles, addNode } from '@jahia/cypress'
import { generateRandomID } from '../utils/utils'

describe('Site settings components - render scope', () => {
    const uniq = generateRandomID().replace(/[^a-z0-9]/gi, '')
    const site = 'renderScope' + uniq

    const siteAdmin = 'renderscopeadmin' + uniq // administers the site
    const lowPriv = 'renderscopelow' + uniq // ordinary account, administers nothing

    // the settings component, placed OUTSIDE the settings container
    const placed = 'placedManageUsers' + uniq
    const area = `/sites/${site}/home/pagecontent`
    // the page that hosts it — this is the URL that gets rendered
    const pageUrl = `/cms/render/default/en/sites/${site}/home.html`

    // accounts the component's own creation flow would produce if it were served and driven
    const byAdmin = 'renderscopebyadmin' + uniq
    const byLowPriv = 'renderscopebylow' + uniq

    before(() => {
        createSite(site, { languages: 'en', templateSet: 'templates-system', serverName: 'localhost', locale: 'en' })

        createUser(siteAdmin, 'password', [{ name: 'j:firstName', value: 'admin' }])
        createUser(lowPriv, 'password', [{ name: 'j:firstName', value: 'low' }])

        // the administrator administers this site; the low-privilege user only gets to read/edit content
        grantRoles(`/sites/${site}`, ['site-administrator'], siteAdmin, 'USER')
        grantRoles(`/sites/${site}`, ['editor'], lowPriv, 'USER')

        // an ordinary content area on the home page, then the settings component inside it
        addNode({ parentPathOrId: `/sites/${site}/home`, primaryNodeType: 'jnt:contentList', name: 'pagecontent' })
        addNode({ parentPathOrId: area, primaryNodeType: 'jnt:siteSettingsManageUsers', name: placed })
    })

    after(() => {
        cy.login()
        ;[byAdmin, byLowPriv].forEach((name) => userPath(name).then((p) => p && deleteUser(name)))
        deleteUser(siteAdmin)
        deleteUser(lowPriv)
        deleteSite(site)
    })

    // ---- out-of-band verification, as root, independent of the driving session ----

    const userPath = (name: string) =>
        cy
            .request({
                method: 'POST',
                url: '/modules/graphql',
                headers: { Origin: Cypress.config().baseUrl as string },
                auth: { username: 'root', password: Cypress.env('SUPER_USER_PASSWORD') as string },
                body: {
                    query: `{jcr(workspace:EDIT){q:nodesByQuery(query:"select * from [jnt:user] where localname()='${name}'"){nodes{path}}}}`,
                },
            })
            .then((res) => (res.body?.data?.jcr?.q?.nodes?.[0]?.path ?? null) as string | null)

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

    // Attempts the component's user-creation flow as whoever is currently logged in. Resolves to the
    // number of flow execution keys the render served, so the caller can assert on exposure too.
    const attemptCreate = (username: string) =>
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
                    if (!createForm) {
                        return cy.wrap({ served, reached: false })
                    }
                    const a = createForm.match(/action="([^"]+)"/)
                    const target = a ? a[1].replace(/&amp;/g, '&') : action
                    return cy
                        .request({
                            method: 'POST',
                            url: target,
                            form: true,
                            failOnStatusCode: false,
                            body: {
                                username,
                                password: 'Passw0rd!1',
                                passwordConfirm: 'Passw0rd!1',
                                preferredLanguage: 'en',
                                accountLocked: 'false',
                                emailNotificationsDisabled: 'false',
                                firstName: 'render',
                                lastName: 'scope',
                                email: 'renderscope@example.invalid',
                                organization: '',
                                _eventId: 'add',
                            },
                        })
                        .then(() => cy.wrap({ served, reached: true }))
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

    it('serves the placed component and creates a user for the site administrator (positive control)', () => {
        cy.login(siteAdmin, 'password')
        attemptCreate(byAdmin).then((outcome: { served: number; reached: boolean }) => {
            expect(outcome.served, 'the administrator must still be served the flow').to.be.greaterThan(0)
            expect(outcome.reached, 'the administrator must still reach the creation form').to.be.true
        })
        cy.login()
        userPath(byAdmin).then((path) => {
            expect(path, 'the administrator must still be able to create a user through the component').to.not.be.null
        })
    })

    it('serves nothing and creates no user for a caller that administers nothing', () => {
        cy.login()
        userPath(byLowPriv).then((existing) => {
            expect(existing, 'baseline: the account must not exist yet').to.be.null
        })

        cy.login(lowPriv, 'password')
        attemptCreate(byLowPriv).then((outcome: { served: number; reached: boolean }) => {
            expect(outcome.served, 'no flow may be served to a caller that administers nothing').to.eq(0)
            expect(outcome.reached, 'the creation form must not be reachable').to.be.false
        })

        cy.login()
        userPath(byLowPriv).then((path) => {
            expect(path, 'no account may be created through the placed component').to.be.null
        })
    })
})
