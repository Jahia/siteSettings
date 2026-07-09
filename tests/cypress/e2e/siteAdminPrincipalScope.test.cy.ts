// Authorization scope test: a site-scoped administrator (site-administrator role on ONE site) must
// only be able to act on principals stored under that site. A management action whose target
// principal is resolved outside the administered site (e.g. a server-global user under /users/)
// must be rejected — the global principal must remain untouched. Opaque by design.
//
// Self-contained: creates its own site, a global user granted site-administrator on that site, and a
// separate global "outsider" user; drives the real Manage Users webflow with a crafted target path;
// asserts the outsider user still exists afterwards. Tears everything down in after().
import gql from 'graphql-tag'
import { createSite, deleteSite, createUser, deleteUser, grantRoles } from '@jahia/cypress'
import { generateRandomID } from '../utils/utils'

describe('Site-administrator principal scope enforcement', () => {
    const siteKey = 'scopeGuardSite' + generateRandomID()
    const siteAdmin = 'scopeadmin_' + generateRandomID()
    const outsider = 'scopeoutsider_' + generateRandomID()

    before(() => {
        createSite(siteKey, {
            languages: 'en',
            templateSet: 'dx-base-demo-templates',
            serverName: 'localhost',
            locale: 'en',
        })
        // both users are created at the server-global store (/users/…)
        createUser(siteAdmin, 'password', [{ name: 'j:firstName', value: 'scope' }])
        createUser(outsider, 'password', [{ name: 'j:firstName', value: 'outsider' }])
        // siteAdmin administers ONLY this site
        grantRoles(`/sites/${siteKey}`, ['site-administrator'], siteAdmin, 'USER')
    })

    after(() => {
        deleteUser(siteAdmin)
        deleteUser(outsider)
        deleteSite(siteKey)
    })

    const globalUserPath = (name: string) =>
        cy
            .apollo({
                query: gql`
                    {
                        jcr(workspace: EDIT) {
                            q: nodesByQuery(
                                query: "select * from [jnt:user] where localname()='${name}' and isdescendantnode('/users')"
                            ) {
                                nodes {
                                    path
                                }
                            }
                        }
                    }
                `,
            })
            .then((res) => res?.data?.jcr?.q?.nodes?.[0]?.path as string)

    const extractFlowAction = (html: string) => {
        const m = html.match(/action="([^"]*manageUsers\.html\?[^"]*webflowexecution[^"]*)"/)
        return m ? m[1].replace(/&amp;/g, '&') : undefined
    }

    it('rejects a Manage Users action whose target user is outside the administered site', () => {
        // resolve the global (out-of-scope) target path as root
        cy.login()
        globalUserPath(outsider).then((outsiderPath) => {
            expect(outsiderPath, 'outsider must be a server-global user').to.match(/^\/users\//)
            cy.logout()

            // act as the site-scoped administrator
            cy.login(siteAdmin, 'password')
            cy.request(`/cms/render/default/en/sites/${siteKey}.manageUsers.html`).then((page) => {
                const action = extractFlowAction(page.body)
                expect(action, 'manage users flow action').to.be.a('string')
                // craft the attack: name a target user that lives outside the administered site
                cy.request({
                    method: 'POST',
                    url: action,
                    form: true,
                    body: { _eventId: 'removeUser', selectedUsers: outsiderPath },
                    failOnStatusCode: false,
                }).then((afterSelect) => {
                    const confirmAction = extractFlowAction(afterSelect.body) || action
                    cy.request({
                        method: 'POST',
                        url: confirmAction,
                        form: true,
                        body: { _eventId: 'confirm' },
                        failOnStatusCode: false,
                    })
                })
            })
            cy.logout()

            // the out-of-scope user must NOT have been deleted
            cy.login()
            globalUserPath(outsider).then((stillThere) => {
                expect(stillThere, 'out-of-scope user must survive the crafted action').to.match(/^\/users\//)
            })
        })
    })
})
