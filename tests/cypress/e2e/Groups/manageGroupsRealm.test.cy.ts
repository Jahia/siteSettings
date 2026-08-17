// Realm resolution test for the Manage Groups administration screen. The screen manages the
// principals of the realm it is reached through, and it is reached through exactly two containers:
// the global settings node, which carries the server-wide realm and its server-global principal
// store, and a site node, which carries that site's realm and store. A container of any other type
// carries no realm, and the screen performs no membership write there.
//
// This spec asserts all three, each through the screen's own web flow: the two realms it manages
// mutate, and a container carrying no realm does not. Opaque by design.
//
// Non-vacuity: the two realm cases ARE the positive controls for the third — they mutate through
// the same flow, the same transition and the same verification instrument, so a driver that had
// stopped working, or a read-back that looked in the wrong place, would take them red too. Group
// members are read at full depth (see memberNames): they live several levels below the group, so a
// children-only query reads a successful write as an absent one.
//
// The third case reaches its container by placing the component on an ordinary page, and a component
// of this module is served only from inside a module, so nothing is served there at all. It therefore
// asserts three things rather than the one it used to: the render serves nothing, a transition built
// for that component reaches no flow, and the group still holds no member. The last of those is the
// same read-back the two realm cases prove works.
import { createSite, deleteSite, createUser, deleteUser } from '@jahia/cypress'
import { generateRandomID } from '../../utils/utils'
import { SiteSettingsGroups } from '../../page-object/siteSettingsGroups'

describe('Manage Groups - realm resolution', () => {
    const uniq = generateRandomID().replace(/[^a-z0-9]/gi, '')
    const siteKey = 'grpRealm' + uniq

    // one group per realm, each with its own member, so no case can consume another's target
    const globalGroup = 'grpRealmGlobal' + uniq
    const siteGroup = 'grpRealmSite' + uniq
    const noRealmGroup = 'grpRealmOther' + uniq
    const globalMember = 'grprealmgmember' + uniq
    const siteMember = 'grprealmsmember' + uniq
    const noRealmMember = 'grprealmomember' + uniq

    // the Manage Groups component, held by the site's home page — a container carrying no realm
    const component = 'grpRealmComponent' + uniq
    const componentPath = `/sites/${siteKey}/home/${component}`
    // `ec` only skips the fragment cache when it carries the rendered node's own identifier, so the
    // uuid the placement returns is kept rather than a random string.
    let componentUuid = ''

    const languages = 'en'
    const templateSet = 'templates-system'

    // ---- out-of-band root channel ----
    // Queried and mutated as root over GraphQL via cy.request, independent of the browser page, so
    // the fixtures and the read-backs report the true stored state whatever the driving session did.

    const asRoot = (query: string) =>
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
        asRoot(
            `{jcr(workspace:EDIT){q:nodesByQuery(query:"select * from [${type}] where localname()='${name}'${
                under ? ` and isdescendantnode('${under}')` : ''
            }"){nodes{path}}}}`,
        ).then((data) => (data?.jcr?.q?.nodes?.[0]?.path ?? null) as string | null)

    // Members live at <group>/j:members/users/<a>/<b>/<c>/<name>, so this walks descendants rather
    // than children — the depth is what makes the read-back conclusive.
    const memberNames = (groupPath: string) =>
        asRoot(
            `{jcr(workspace:EDIT){nodeByPath(path:"${groupPath}"){members:descendants(typesFilter:{types:["jnt:member"]}){nodes{name}}}}}`,
        ).then((data) => (data?.jcr?.nodeByPath?.members?.nodes || []).map((n: { name: string }) => n.name))

    before(() => {
        createSite(siteKey, { languages, templateSet, serverName: 'localhost', locale: 'en' })

        createUser(globalMember, 'password', [{ name: 'j:firstName', value: 'globalrealm' }])
        createUser(siteMember, 'password', [{ name: 'j:firstName', value: 'siterealm' }])
        createUser(noRealmMember, 'password', [{ name: 'j:firstName', value: 'otherrealm' }])

        cy.executeGroovy('groovy/createGlobalGroup.groovy', { GROUP_NAME: globalGroup })
        cy.executeGroovy('groovy/createGlobalGroup.groovy', { GROUP_NAME: noRealmGroup })
        cy.executeGroovy('groovy/createSiteGroup.groovy', { SITE_KEY: siteKey, GROUP_NAME: siteGroup })

        // hold the screen's component on an ordinary page of the site
        asRoot(
            `mutation{jcr(workspace:EDIT){addNode(parentPathOrId:"/sites/${siteKey}/home",name:"${component}",primaryNodeType:"jnt:siteSettingsManageGroups"){uuid}}}`,
        ).then((data) => {
            expect(data?.jcr?.addNode?.uuid, 'the component must be in place').to.be.a('string')
            componentUuid = data.jcr.addNode.uuid
        })
    })

    after(() => {
        deleteUser(globalMember)
        deleteUser(siteMember)
        deleteUser(noRealmMember)
        cy.executeGroovy('groovy/deleteGlobalGroup.groovy', { GROUP_NAME: globalGroup })
        cy.executeGroovy('groovy/deleteGlobalGroup.groovy', { GROUP_NAME: noRealmGroup })
        deleteSite(siteKey)
    })

    // ---- browser driver: the screen's own UI path, on a group its realm lists ----

    const addMemberThroughScreen = (groupName: string, username: string) => {
        new SiteSettingsGroups().openGroupByName(groupName).startAddUsers().addUsersToSelection(username).save()
    }

    it('server-wide realm: adds a member to a group of the server-global store', () => {
        cy.login()
        nodePath('jnt:group', globalGroup, '/groups').then((groupPath) => {
            expect(groupPath, 'target must live in the server-global store').to.match(/^\/groups\//)
            memberNames(groupPath as string).then((before: string[]) => {
                expect(before, 'baseline: the group holds no member').to.be.empty
            })

            cy.visit('/cms/adminframe/default/en/settings.manageGroups.html')
            addMemberThroughScreen(globalGroup, globalMember)

            memberNames(groupPath as string).then((after: string[]) => {
                expect(after, 'the server-wide realm must add the member').to.include(globalMember)
            })
        })
    })

    it('site realm: adds a member to a group of that site', () => {
        cy.login()
        nodePath('jnt:group', siteGroup, `/sites/${siteKey}`).then((groupPath) => {
            expect(groupPath, "target must live in the site's store").to.match(new RegExp(`^/sites/${siteKey}/`))
            memberNames(groupPath as string).then((before: string[]) => {
                expect(before, 'baseline: the group holds no member').to.be.empty
            })

            SiteSettingsGroups.visit(siteKey)
            addMemberThroughScreen(siteGroup, siteMember)

            memberNames(groupPath as string).then((after: string[]) => {
                expect(after, 'the site realm must add the member').to.include(siteMember)
            })
        })
    })

    it('a container carrying no realm: adds no member', () => {
        cy.login()
        nodePath('jnt:group', noRealmGroup, '/groups').then((groupPath) => {
            memberNames(groupPath as string).then((before: string[]) => {
                expect(before, 'baseline: the group holds no member').to.be.empty
            })

            nodePath('jnt:user', noRealmMember).then((memberPath) => {
                expect(memberPath, 'the member must exist, or the write below could not have happened').to.be.a(
                    'string',
                )

                // Addressed on its own rather than through a page, so the page scripts the two cases
                // above rely on are not part of the response.
                const render = `/cms/render/default/en${componentPath}.html.ajax?ec=${componentUuid}`

                cy.request({ method: 'GET', url: render, failOnStatusCode: false }).then((res) => {
                    // Reachable in live, or "serves nothing" is indistinguishable from "never got there".
                    expect(res.status, 'the component must be reachable for this case to mean anything').to.eq(200)
                    expect(String(res.body || '').trim(), 'a container carrying no realm must serve nothing').to.eq('')
                })

                // The transition names its component in the parameter's own name, so it is built rather
                // than read off a screen that served none. Without this the case would go quiet exactly
                // when the rule holds, and the read-back below would pass for the wrong reason.
                cy.then(() =>
                    cy
                        .request({
                            method: 'POST',
                            url: `/cms/render/default/en${componentPath}.html.ajax`,
                            form: true,
                            body: {
                                [`webflowexecution${componentUuid.replace(/-/g, '_')}`]: 'e1s1',
                                _eventId_save: '',
                                addedMembers: `u:${memberPath}`,
                                removedMembers: '',
                            },
                            followRedirect: false,
                            failOnStatusCode: false,
                        })
                        .then((driven) => {
                            // A transition a flow took answers a redirect naming the next step. One that
                            // reached no flow answers 200 and names none, so `followRedirect` stays off.
                            expect(driven.status, 'a transition on this container must reach no flow').to.eq(200)
                        }),
                )

                memberNames(groupPath as string).then((after: string[]) => {
                    expect(after, 'a container carrying no realm must add no member').to.be.empty
                })
            })
        })
    })
})
