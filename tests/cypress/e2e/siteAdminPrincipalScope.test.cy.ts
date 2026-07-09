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
    const otherSite = 'scopeOtherSite' + generateRandomID()
    const siteAdmin = 'scopeadmin_' + generateRandomID()
    const outsider = 'scopeoutsider_' + generateRandomID()
    const otherSiteUser = 'scopeother_' + generateRandomID()
    const siteGroup = 'scopegrp_' + generateRandomID()

    before(() => {
        createSite(siteKey, {
            languages: 'en',
            templateSet: 'dx-base-demo-templates',
            serverName: 'localhost',
            locale: 'en',
        })
        createSite(otherSite, {
            languages: 'en',
            templateSet: 'dx-base-demo-templates',
            serverName: 'localhost',
            locale: 'en',
        })
        // both users are created at the server-global store (/users/…)
        createUser(siteAdmin, 'password', [{ name: 'j:firstName', value: 'scope' }])
        createUser(outsider, 'password', [{ name: 'j:firstName', value: 'outsider' }])
        // a SITE-scoped user living under ANOTHER site (/sites/<otherSite>/users/…)
        cy.executeGroovy('groovy/createSiteUserWithTitle.groovy', {
            USER_NAME: otherSiteUser,
            SITE_KEY: otherSite,
            PASSWORD: 'password',
            TITLE_VALUE: 'other site user',
        })
        // a group inside the administered site (/sites/<siteKey>/groups/…)
        cy.executeGroovy('groovy/createSiteGroup.groovy', { GROUP_NAME: siteGroup, SITE_KEY: siteKey })
        // siteAdmin administers ONLY siteKey
        grantRoles(`/sites/${siteKey}`, ['site-administrator'], siteAdmin, 'USER')
    })

    after(() => {
        deleteUser(siteAdmin)
        deleteUser(outsider)
        deleteSite(siteKey)
        deleteSite(otherSite)
    })

    const nodePathByName = (name: string, type: string, under: string) =>
        cy
            .apollo({
                query: gql`
                    {
                        jcr(workspace: EDIT) {
                            q: nodesByQuery(
                                query: "select * from [${type}] where localname()='${name}' and isdescendantnode('${under}')"
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

    const groupMemberNames = (groupPath: string) =>
        cy
            .apollo({
                query: gql`
                    {
                        jcr(workspace: EDIT) {
                            nodeByPath(path: "${groupPath}") {
                                members: descendants(typesFilter: { types: ["jnt:member"] }) {
                                    nodes {
                                        name
                                    }
                                }
                            }
                        }
                    }
                `,
            })
            .then((res) => (res?.data?.jcr?.nodeByPath?.members?.nodes || []).map((n: { name: string }) => n.name))

    const extractGroupsAction = (html: string) => {
        const m = html.match(/action="([^"]*manageGroups\.html\?[^"]*webflowexecution[^"]*)"/)
        return m ? m[1].replace(/&amp;/g, '&') : undefined
    }

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

    it('adds a global member to a site group but rejects a member from another site', () => {
        cy.login()
        nodePathByName(siteGroup, 'jnt:group', `/sites/${siteKey}`).then((groupPath) => {
            expect(groupPath, 'site group path').to.match(new RegExp(`^/sites/${siteKey}/`))
            globalUserPath(outsider).then((globalPath) => {
                nodePathByName(otherSiteUser, 'jnt:user', `/sites/${otherSite}`).then((otherPath) => {
                    expect(otherPath, 'other-site user path').to.match(new RegExp(`^/sites/${otherSite}/`))
                    cy.logout()

                    // as the siteKey administrator, try to add BOTH a global user (allowed) and a
                    // user from another site (must be rejected) to a group in the administered site
                    cy.login(siteAdmin, 'password')
                    cy.request(`/cms/render/default/en/sites/${siteKey}.manageGroups.html`).then((page) => {
                        const action = extractGroupsAction(page.body)
                        expect(action, 'manage groups flow action').to.be.a('string')
                        cy.request({
                            method: 'POST',
                            url: action,
                            form: true,
                            body: { _eventId: 'editGroupMembers', selectedGroup: groupPath },
                            failOnStatusCode: false,
                        }).then((afterSelect) => {
                            const saveAction = extractGroupsAction(afterSelect.body) || action
                            cy.request({
                                method: 'POST',
                                url: saveAction,
                                form: true,
                                body: {
                                    _eventId: 'save',
                                    addedMembers: [`u:${globalPath}`, `u:${otherPath}`],
                                    removedMembers: '',
                                },
                                failOnStatusCode: false,
                            })
                        })
                    })
                    cy.logout()

                    // global member accepted; cross-site member rejected
                    cy.login()
                    groupMemberNames(groupPath).then((names: string[]) => {
                        expect(names, 'global user must be an accepted member').to.include(outsider)
                        expect(names, 'cross-site user must be rejected as member').to.not.include(otherSiteUser)
                    })
                })
            })
        })
    })
})
