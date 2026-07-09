// Authorization scope test (extended coverage). A site-scoped administrator (site-administrator role
// on ONE site) must only be able to act on principals stored under that site's principal tree. Every
// management action of the Manage Users / Manage Groups administration screens is exercised here with
// a target resolved OUTSIDE the administered site (a server-global principal, or a principal owned by
// another site); the action must leave the out-of-scope principal untouched. Negative controls prove
// the guard does not over-block: the same actions on IN-scope principals still succeed.
//
// This complements siteAdminPrincipalScope.test.cy.ts (which covers removeUser/global and the group
// member hybrid rule) and does not overlap its assertions. Opaque by design.
//
// Because the administration UI never lists an out-of-scope principal, the real web flow is driven
// directly with a crafted target path (exactly the request a browser posts), and the effect is then
// verified through the JCR GraphQL API. Fully self-contained: creates its own two sites and principals
// in before(), tears everything down in after().
import gql from 'graphql-tag'
import { createSite, deleteSite, createUser, deleteUser, grantRoles } from '@jahia/cypress'
import { generateRandomID } from '../utils/utils'

describe('Site-administrator principal scope enforcement (extended)', () => {
    const siteKey = 'scopeExtSite' + generateRandomID()
    const otherSite = 'scopeExtOther' + generateRandomID()

    // server-global principals
    const siteAdmin = 'scopeextadmin' + generateRandomID()
    const globalUser = 'scopeextglobal' + generateRandomID()
    const globalGroup = 'scopeextgg' + generateRandomID()

    // principals owned by ANOTHER site (/sites/<otherSite>/...) — all out of scope for siteAdmin
    const otherUserRemove = 'scopeextotheruremove' + generateRandomID()
    const otherUserUpdate = 'scopeextotheruupdate' + generateRandomID()
    const otherUserMember = 'scopeextotherumember' + generateRandomID()
    const otherGroupRemove = 'scopeextothergremove' + generateRandomID()
    const otherGroupAdd = 'scopeextothergadd' + generateRandomID()

    // principals owned by the administered site (/sites/<siteKey>/...) — in scope
    const siteUserAccepted = 'scopeextsiteuaccept' + generateRandomID()
    const siteUserRemove = 'scopeextsiteuremove' + generateRandomID()
    const siteUserUpdate = 'scopeextsiteuupdate' + generateRandomID()
    const siteGroupHybrid = 'scopeextsitegrphybrid' + generateRandomID()
    const siteGroupNegAdd = 'scopeextsitegrpnegadd' + generateRandomID()
    const siteGroupNegRemove = 'scopeextsitegrpnegremove' + generateRandomID()

    const ORIGINAL_FIRST_NAME = 'originalFirstName'

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

        // server-global principals
        createUser(siteAdmin, 'password', [{ name: 'j:firstName', value: 'scope' }])
        createUser(globalUser, 'password', [{ name: 'j:firstName', value: 'global' }])
        cy.executeGroovy('groovy/createGlobalGroup.groovy', { GROUP_NAME: globalGroup })

        // principals owned by the OTHER site
        cy.executeGroovy('groovy/createSiteUserWithTitle.groovy', {
            USER_NAME: otherUserRemove,
            SITE_KEY: otherSite,
            PASSWORD: 'password',
            TITLE_VALUE: 'other remove target',
        })
        cy.executeGroovy('groovy/createSiteUserWithFirstName.groovy', {
            USER_NAME: otherUserUpdate,
            SITE_KEY: otherSite,
            PASSWORD: 'password',
            FIRST_NAME_VALUE: ORIGINAL_FIRST_NAME,
        })
        cy.executeGroovy('groovy/createSiteUserWithTitle.groovy', {
            USER_NAME: otherUserMember,
            SITE_KEY: otherSite,
            PASSWORD: 'password',
            TITLE_VALUE: 'other member',
        })
        cy.executeGroovy('groovy/createSiteGroup.groovy', { GROUP_NAME: otherGroupRemove, SITE_KEY: otherSite })
        cy.executeGroovy('groovy/createSiteGroup.groovy', { GROUP_NAME: otherGroupAdd, SITE_KEY: otherSite })

        // principals owned by the administered site
        cy.executeGroovy('groovy/createSiteUserWithTitle.groovy', {
            USER_NAME: siteUserAccepted,
            SITE_KEY: siteKey,
            PASSWORD: 'password',
            TITLE_VALUE: 'same site accepted',
        })
        cy.executeGroovy('groovy/createSiteUserWithTitle.groovy', {
            USER_NAME: siteUserRemove,
            SITE_KEY: siteKey,
            PASSWORD: 'password',
            TITLE_VALUE: 'same site remove target',
        })
        cy.executeGroovy('groovy/createSiteUserWithFirstName.groovy', {
            USER_NAME: siteUserUpdate,
            SITE_KEY: siteKey,
            PASSWORD: 'password',
            FIRST_NAME_VALUE: ORIGINAL_FIRST_NAME,
        })
        cy.executeGroovy('groovy/createSiteGroup.groovy', { GROUP_NAME: siteGroupHybrid, SITE_KEY: siteKey })
        cy.executeGroovy('groovy/createSiteGroup.groovy', { GROUP_NAME: siteGroupNegAdd, SITE_KEY: siteKey })
        cy.executeGroovy('groovy/createSiteGroup.groovy', { GROUP_NAME: siteGroupNegRemove, SITE_KEY: siteKey })

        // siteAdmin administers ONLY siteKey
        grantRoles(`/sites/${siteKey}`, ['site-administrator'], siteAdmin, 'USER')
    })

    after(() => {
        deleteUser(siteAdmin)
        deleteUser(globalUser)
        cy.executeGroovy('groovy/deleteGlobalGroup.groovy', { GROUP_NAME: globalGroup })
        deleteSite(siteKey)
        deleteSite(otherSite)
    })

    // ---- GraphQL helpers (run as root) ----

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
            .then((res) => res?.data?.jcr?.q?.nodes?.[0]?.path as string | undefined)

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
            .then((res) => res?.data?.jcr?.q?.nodes?.[0]?.path as string | undefined)

    const globalGroupPath = (name: string) =>
        cy
            .apollo({
                query: gql`
                    {
                        jcr(workspace: EDIT) {
                            q: nodesByQuery(
                                query: "select * from [jnt:group] where localname()='${name}' and isdescendantnode('/groups')"
                            ) {
                                nodes {
                                    path
                                }
                            }
                        }
                    }
                `,
            })
            .then((res) => res?.data?.jcr?.q?.nodes?.[0]?.path as string | undefined)

    const userFirstName = (path: string) =>
        cy
            .apollo({
                query: gql`
                    {
                        jcr(workspace: EDIT) {
                            nodeByPath(path: "${path}") {
                                property(name: "j:firstName") {
                                    value
                                }
                            }
                        }
                    }
                `,
            })
            .then((res) => res?.data?.jcr?.nodeByPath?.property?.value as string | undefined)

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

    // ---- flow action extraction ----

    const extractUsersAction = (html: string) => {
        const m = html.match(/action="([^"]*manageUsers\.html\?[^"]*webflowexecution[^"]*)"/)
        return m ? m[1].replace(/&amp;/g, '&') : undefined
    }

    const extractGroupsAction = (html: string) => {
        const m = html.match(/action="([^"]*manageGroups\.html\?[^"]*webflowexecution[^"]*)"/)
        return m ? m[1].replace(/&amp;/g, '&') : undefined
    }

    // ---- flow drivers (act as the site-scoped administrator) ----

    // removeUser is a two-step flow: select the target, then confirm.
    const driveRemoveUser = (targetPath: string) => {
        cy.request(`/cms/render/default/en/sites/${siteKey}.manageUsers.html`).then((page) => {
            const action = extractUsersAction(page.body)
            expect(action, 'manage users flow action').to.be.a('string')
            cy.request({
                method: 'POST',
                url: action,
                form: true,
                body: { _eventId: 'removeUser', selectedUsers: targetPath },
                failOnStatusCode: false,
            }).then((afterSelect) => {
                const confirmAction = extractUsersAction(afterSelect.body) || action
                cy.request({
                    method: 'POST',
                    url: confirmAction,
                    form: true,
                    body: { _eventId: 'confirm' },
                    failOnStatusCode: false,
                })
            })
        })
    }

    // updateUser is a two-step flow: open the editor for the target, then submit changed properties.
    const driveUpdateUser = (targetPath: string, newFirstName: string) => {
        cy.request(`/cms/render/default/en/sites/${siteKey}.manageUsers.html`).then((page) => {
            const action = extractUsersAction(page.body)
            expect(action, 'manage users flow action').to.be.a('string')
            cy.request({
                method: 'POST',
                url: action,
                form: true,
                body: { _eventId: 'editUser', selectedUsers: targetPath },
                failOnStatusCode: false,
            }).then((afterSelect) => {
                const updateAction = extractUsersAction(afterSelect.body) || action
                cy.request({
                    method: 'POST',
                    url: updateAction,
                    form: true,
                    // userKey identifies the principal the handler will resolve and act on
                    body: { _eventId: 'update', userKey: targetPath, firstName: newFirstName },
                    failOnStatusCode: false,
                })
            })
        })
    }

    // removeGroup is a single-step flow on the manageGroups view-state.
    const driveRemoveGroup = (targetGroupPath: string) => {
        cy.request(`/cms/render/default/en/sites/${siteKey}.manageGroups.html`).then((page) => {
            const action = extractGroupsAction(page.body)
            expect(action, 'manage groups flow action').to.be.a('string')
            cy.request({
                method: 'POST',
                url: action,
                form: true,
                body: { _eventId: 'removeGroup', selectedGroup: targetGroupPath },
                failOnStatusCode: false,
            })
        })
    }

    // addMembers is a two-step flow: open the target group's member editor, then save added members.
    const driveAddMembers = (targetGroupPath: string, addedMembers: string[]) => {
        cy.request(`/cms/render/default/en/sites/${siteKey}.manageGroups.html`).then((page) => {
            const action = extractGroupsAction(page.body)
            expect(action, 'manage groups flow action').to.be.a('string')
            cy.request({
                method: 'POST',
                url: action,
                form: true,
                body: { _eventId: 'editGroupMembers', selectedGroup: targetGroupPath },
                failOnStatusCode: false,
            }).then((afterSelect) => {
                const saveAction = extractGroupsAction(afterSelect.body) || action
                cy.request({
                    method: 'POST',
                    url: saveAction,
                    form: true,
                    body: { _eventId: 'save', addedMembers, removedMembers: '' },
                    failOnStatusCode: false,
                })
            })
        })
    }

    // =====================================================================================
    // Out-of-scope targets must be rejected (guard active)
    // =====================================================================================

    it('removeUser: a target user owned by another site survives', () => {
        cy.login()
        nodePathByName(otherUserRemove, 'jnt:user', `/sites/${otherSite}`).then((targetPath) => {
            expect(targetPath, 'target must be a user of the other site').to.match(new RegExp(`^/sites/${otherSite}/`))
            cy.logout()

            cy.login(siteAdmin, 'password')
            driveRemoveUser(targetPath as string)
            cy.logout()

            cy.login()
            nodePathByName(otherUserRemove, 'jnt:user', `/sites/${otherSite}`).then((stillThere) => {
                expect(stillThere, 'cross-site user must survive the crafted removeUser').to.match(
                    new RegExp(`^/sites/${otherSite}/`),
                )
            })
        })
    })

    it('updateUser: properties of a target user owned by another site are left unchanged', () => {
        cy.login()
        nodePathByName(otherUserUpdate, 'jnt:user', `/sites/${otherSite}`).then((targetPath) => {
            expect(targetPath, 'target must be a user of the other site').to.match(new RegExp(`^/sites/${otherSite}/`))
            userFirstName(targetPath as string).then((before) => {
                expect(before, 'baseline first name').to.equal(ORIGINAL_FIRST_NAME)
                cy.logout()

                cy.login(siteAdmin, 'password')
                driveUpdateUser(targetPath as string, 'tamperedFirstName')
                cy.logout()

                cy.login()
                userFirstName(targetPath as string).then((after) => {
                    expect(after, 'cross-site user first name must be unchanged').to.equal(ORIGINAL_FIRST_NAME)
                })
            })
        })
    })

    it('removeGroup: a target group owned by another site survives', () => {
        cy.login()
        nodePathByName(otherGroupRemove, 'jnt:group', `/sites/${otherSite}`).then((targetPath) => {
            expect(targetPath, 'target must be a group of the other site').to.match(new RegExp(`^/sites/${otherSite}/`))
            cy.logout()

            cy.login(siteAdmin, 'password')
            driveRemoveGroup(targetPath as string)
            cy.logout()

            cy.login()
            nodePathByName(otherGroupRemove, 'jnt:group', `/sites/${otherSite}`).then((stillThere) => {
                expect(stillThere, 'cross-site group must survive the crafted removeGroup').to.match(
                    new RegExp(`^/sites/${otherSite}/`),
                )
            })
        })
    })

    it('removeGroup: a target group in the server-global store survives', () => {
        cy.login()
        globalGroupPath(globalGroup).then((targetPath) => {
            expect(targetPath, 'target must be a server-global group').to.match(/^\/groups\//)
            cy.logout()

            cy.login(siteAdmin, 'password')
            driveRemoveGroup(targetPath as string)
            cy.logout()

            cy.login()
            globalGroupPath(globalGroup).then((stillThere) => {
                expect(stillThere, 'global group must survive the crafted removeGroup').to.match(/^\/groups\//)
            })
        })
    })

    it('addMembers: membership of a target group owned by another site is left unchanged', () => {
        cy.login()
        nodePathByName(otherGroupAdd, 'jnt:group', `/sites/${otherSite}`).then((targetGroupPath) => {
            expect(targetGroupPath, 'target must be a group of the other site').to.match(
                new RegExp(`^/sites/${otherSite}/`),
            )
            // a perfectly valid member key (a server-global user) — the point being tested is that the
            // TARGET GROUP itself is out of scope, so the whole operation must be refused
            globalUserPath(globalUser).then((memberPath) => {
                cy.logout()

                cy.login(siteAdmin, 'password')
                driveAddMembers(targetGroupPath as string, [`u:${memberPath}`])
                cy.logout()

                cy.login()
                groupMemberNames(targetGroupPath as string).then((names: string[]) => {
                    expect(names, 'no member must have been added to the cross-site group').to.not.include(globalUser)
                })
            })
        })
    })

    it('addMembers member rule: same-site and global members are accepted, another site is rejected', () => {
        cy.login()
        nodePathByName(siteGroupHybrid, 'jnt:group', `/sites/${siteKey}`).then((groupPath) => {
            expect(groupPath, 'target group must belong to the administered site').to.match(
                new RegExp(`^/sites/${siteKey}/`),
            )
            globalUserPath(globalUser).then((globalPath) => {
                nodePathByName(siteUserAccepted, 'jnt:user', `/sites/${siteKey}`).then((samePath) => {
                    nodePathByName(otherUserMember, 'jnt:user', `/sites/${otherSite}`).then((otherPath) => {
                        expect(samePath, 'same-site member path').to.match(new RegExp(`^/sites/${siteKey}/`))
                        expect(otherPath, 'other-site member path').to.match(new RegExp(`^/sites/${otherSite}/`))
                        cy.logout()

                        cy.login(siteAdmin, 'password')
                        driveAddMembers(groupPath as string, [`u:${globalPath}`, `u:${samePath}`, `u:${otherPath}`])
                        cy.logout()

                        cy.login()
                        groupMemberNames(groupPath as string).then((names: string[]) => {
                            expect(names, 'global member must be accepted').to.include(globalUser)
                            expect(names, 'same-site member must be accepted').to.include(siteUserAccepted)
                            expect(names, 'another-site member must be rejected').to.not.include(otherUserMember)
                        })
                    })
                })
            })
        })
    })

    // =====================================================================================
    // Negative controls: IN-scope operations must still succeed (guard does not over-block)
    // =====================================================================================

    it('negative control - removeUser: a same-site user is removed', () => {
        cy.login()
        nodePathByName(siteUserRemove, 'jnt:user', `/sites/${siteKey}`).then((targetPath) => {
            expect(targetPath, 'target must be a user of the administered site').to.match(
                new RegExp(`^/sites/${siteKey}/`),
            )
            cy.logout()

            cy.login(siteAdmin, 'password')
            driveRemoveUser(targetPath as string)
            cy.logout()

            cy.login()
            nodePathByName(siteUserRemove, 'jnt:user', `/sites/${siteKey}`).then((gone) => {
                expect(gone, 'in-scope user must be removed').to.be.undefined
            })
        })
    })

    it('negative control - addMembers: a same-site user is added to a same-site group', () => {
        cy.login()
        nodePathByName(siteGroupNegAdd, 'jnt:group', `/sites/${siteKey}`).then((groupPath) => {
            expect(groupPath, 'group must belong to the administered site').to.match(new RegExp(`^/sites/${siteKey}/`))
            nodePathByName(siteUserAccepted, 'jnt:user', `/sites/${siteKey}`).then((memberPath) => {
                cy.logout()

                cy.login(siteAdmin, 'password')
                driveAddMembers(groupPath as string, [`u:${memberPath}`])
                cy.logout()

                cy.login()
                groupMemberNames(groupPath as string).then((names: string[]) => {
                    expect(names, 'in-scope member must be added').to.include(siteUserAccepted)
                })
            })
        })
    })

    it('negative control - updateUser: a same-site user property is updated (proves the driver mutates)', () => {
        cy.login()
        nodePathByName(siteUserUpdate, 'jnt:user', `/sites/${siteKey}`).then((targetPath) => {
            expect(targetPath, 'target must be a user of the administered site').to.match(
                new RegExp(`^/sites/${siteKey}/`),
            )
            cy.logout()

            cy.login(siteAdmin, 'password')
            driveUpdateUser(targetPath as string, 'updatedFirstName')
            cy.logout()

            cy.login()
            userFirstName(targetPath as string).then((after) => {
                expect(after, 'in-scope user first name must be updated').to.equal('updatedFirstName')
            })
        })
    })

    it('negative control - removeGroup: a same-site group is removed', () => {
        cy.login()
        nodePathByName(siteGroupNegRemove, 'jnt:group', `/sites/${siteKey}`).then((targetPath) => {
            expect(targetPath, 'group must belong to the administered site').to.match(new RegExp(`^/sites/${siteKey}/`))
            cy.logout()

            cy.login(siteAdmin, 'password')
            driveRemoveGroup(targetPath as string)
            cy.logout()

            cy.login()
            nodePathByName(siteGroupNegRemove, 'jnt:group', `/sites/${siteKey}`).then((gone) => {
                expect(gone, 'in-scope group must be removed').to.be.undefined
            })
        })
    })
})
