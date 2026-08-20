// Realm resolution test for the Manage Users administration screen, on its READ path. The screen
// lists the principals of the realm it is reached through, and it is reached through exactly two
// containers: the global settings node, which carries the server-wide realm and its server-global
// principal store, and a site node, which carries that site's realm and store. A container of any
// other type carries no realm, and the screen lists nothing there.
//
// The listing is what this spec measures, because the listing is what the flow evaluates on every
// render of the search view. Each case reads it through the screen's own web flow. Opaque by design.
//
// Non-vacuity: the two realm cases ARE the positive controls for the third. They assert the listing
// on the same instrument (the row checkbox, whose value is the principal's path) through the same
// screen, so a driver that had stopped working, or a page that failed to render, would take them red
// too. They also cross-check each other: each realm must list ITS principal and not the other's, so a
// screen that ignored the realm entirely could not pass both.
//
// The third case reaches its container by placing the component on an ordinary page, and a component
// of this module is served only from inside a module, so nothing is served there at all. That is a
// stronger statement than the empty listing this case used to assert, and it is the one asserted now:
// no body, no flow, and no transition accepted. The two realm cases remain its positive controls,
// because they prove the screen does render and does list when it is reached legitimately.
import { createSite, deleteSite, createUser, deleteUser } from '@jahia/cypress'
import { generateRandomID } from '../../utils/utils'
import { SiteSettingsUsers } from '../../page-object/siteSettingsUsers'

describe('Manage Users - realm resolution on the listing', () => {
    const uniq = generateRandomID().replace(/[^a-z0-9]/gi, '')
    const siteKey = 'usrRealm' + uniq

    // one principal per realm, so no case can read another's target as its own
    const globalUser = 'usrrealmglobal' + uniq
    const siteUser = 'usrrealmsite' + uniq

    // the Manage Users component, held by the site's home page — a container carrying no realm
    const component = 'usrRealmComponent' + uniq
    const componentPath = `/sites/${siteKey}/home/${component}`
    // `ec` only skips the fragment cache when it carries the rendered node's own identifier, so the
    // uuid the placement returns is kept rather than a random string.
    let componentUuid = ''

    const languages = 'en'
    const templateSet = 'templates-system'

    // ---- out-of-band root channel ----
    // Queried as root over GraphQL via cy.request, independent of the browser page, so the paths the
    // assertions below look for are the true stored ones whatever the driving session did.

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

    before(() => {
        createSite(siteKey, { languages, templateSet, serverName: 'localhost', locale: 'en' })

        // a principal of the server-global store, and one of the site's own store
        createUser(globalUser, 'password', [{ name: 'j:firstName', value: 'globalrealm' }])
        cy.executeGroovy('groovy/createSiteUserWithTitle.groovy', {
            USER_NAME: siteUser,
            SITE_KEY: siteKey,
            PASSWORD: 'password',
            TITLE_VALUE: 'siterealm',
        })

        // hold the screen's component on an ordinary page of the site
        asRoot(
            `mutation{jcr(workspace:EDIT){addNode(parentPathOrId:"/sites/${siteKey}/home",name:"${component}",primaryNodeType:"jnt:siteSettingsManageUsers"){uuid}}}`,
        ).then((data) => {
            expect(data?.jcr?.addNode?.uuid, 'the component must be in place').to.be.a('string')
            componentUuid = data.jcr.addNode.uuid
        })
    })

    after(() => {
        deleteUser(globalUser)
        // the site user lives under /sites/<siteKey>, so deleting the site removes it
        deleteSite(siteKey)
    })

    // ---- browser driver: the listing's own row checkbox, whose value is the principal's path ----

    const rowFor = (username: string) => cy.get('body').find(`input.userCheckbox[value$="/${username}"]`)

    it('server-wide realm: lists the server-global principal, not the site one', () => {
        cy.login()
        // The screen itself, not the administration shell that embeds it: the shell's own route
        // renders no listing of its own, so an assertion there would measure the wrapper.
        cy.visit('/cms/adminframe/default/en/settings.manageUsers.html')

        rowFor(globalUser).should('have.length', 1)
        cy.get('body').find(`input.userCheckbox[value$="/${siteUser}"]`).should('have.length', 0)
    })

    it("site realm: lists that site's principal, not the server-global one", () => {
        cy.login()
        SiteSettingsUsers.visit(siteKey)

        rowFor(siteUser).should('have.length', 1)
        cy.get('body').find(`input.userCheckbox[value$="/${globalUser}"]`).should('have.length', 0)
    })

    it('a container carrying no realm: lists nothing', () => {
        cy.login()
        // Addressed on its own rather than through a page, so the page scripts the two cases above rely
        // on are not part of the response. cy.request keeps the same session as those two.
        const render = `/cms/render/default/en${componentPath}.html.ajax?ec=${componentUuid}`

        // The principals must exist, or their absence from the listing below is vacuous.
        nodePath('jnt:user', globalUser, '/users').then((globalPath) => {
            expect(globalPath, 'the global principal must exist').to.match(/^\/users\//)
        })
        nodePath('jnt:user', siteUser, `/sites/${siteKey}`).then((sitePath) => {
            expect(sitePath, 'the site principal must exist').to.match(new RegExp(`^/sites/${siteKey}/`))
        })

        cy.request({ method: 'GET', url: render, failOnStatusCode: false }).then((res) => {
            // Reachable in live, or "serves nothing" is indistinguishable from "never got there".
            expect(res.status, 'the component must be reachable for this case to mean anything').to.eq(200)
            expect(String(res.body || '').trim(), 'a container carrying no realm must serve nothing').to.eq('')
        })

        // The transition names its component in the parameter's own name, so it is built rather than
        // read off a screen that served none. Without this the case would go quiet exactly when the
        // rule holds.
        cy.then(() =>
            cy
                .request({
                    method: 'POST',
                    url: `/cms/render/default/en${componentPath}.html.ajax`,
                    form: true,
                    body: { [`webflowexecution${componentUuid.replace(/-/g, '_')}`]: 'e1s1' },
                    followRedirect: false,
                    failOnStatusCode: false,
                })
                .then((driven) => {
                    // A transition a flow took answers a redirect naming the next step. One that reached
                    // no flow answers 200 and names none, so `followRedirect` has to stay off. The status
                    // carries the case on its own: WebflowAction discards the render result, so the body is
                    // empty whatever the transition did and asserting on it could not fail.
                    expect(driven.status, 'a transition on this container must reach no flow').to.eq(200)
                }),
        )
    })
})
