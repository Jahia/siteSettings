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
// screen that ignored the realm entirely could not pass both. The third case additionally asserts the
// search view really rendered before concluding the listing is empty — an absent row and an absent
// page look identical in a response body.
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
        // Driven with a direct render request: the component is addressed on its own, so the page
        // scripts the two cases above rely on are not part of the response. cy.request keeps the same
        // session and the same flow as those two.
        const render = `/cms/render/default/en${componentPath}.html.ajax?ec=${uniq}`

        cy.request({ method: 'GET', url: render }).then((res) => {
            const body = (res.body as string) || ''

            // The search view must have rendered, or an empty listing proves nothing: an absent row and
            // a page that never came back are the same string.
            expect(body, 'the screen must hand out a live flow, or this case proves nothing').to.match(
                /webflowexecution/,
            )

            // The screen also reports how many principals it withheld from the listing. That count is
            // itself a fact about a store, so with no realm resolved there is none to report.
            expect(body, 'a container carrying no realm must report no withheld principal').not.to.contain(
                'is not displayed',
            )

            nodePath('jnt:user', globalUser, '/users').then((globalPath) => {
                expect(globalPath, 'the global principal must exist, or its absence below is vacuous').to.match(
                    /^\/users\//,
                )
                expect(body, 'a container carrying no realm must list no server-global principal').not.to.contain(
                    globalPath as string,
                )
            })

            nodePath('jnt:user', siteUser, `/sites/${siteKey}`).then((sitePath) => {
                expect(sitePath, 'the site principal must exist, or its absence below is vacuous').to.match(
                    new RegExp(`^/sites/${siteKey}/`),
                )
                expect(body, 'a container carrying no realm must list no site principal').not.to.contain(
                    sitePath as string,
                )
            })
        })
    })
})
