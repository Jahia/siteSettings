// Realm resolution test for the Manage Users administration screen, on its READ path. The screen
// lists the principals of the realm it is reached through, and it is reached through exactly two
// containers: the global settings node, which carries the server-wide realm and its server-global
// principal store, and a site node, which carries that site's realm and store. A container of any
// other type carries no realm, and the screen lists nothing there.
//
// The listing is what this spec measures for the two realms, because the listing is what the flow
// evaluates on every render of the search view. Each reads it through the screen's own web flow. A
// container carrying no realm is not one of the two the screen is reached through, so it is served
// neither a flow nor a listing. Opaque by design.
//
// Non-vacuity: the two realm cases ARE the positive controls for the third. They assert the listing
// on the same instrument (the row checkbox, whose value is the principal's path) through the same
// screen, so a driver that had stopped working, or a page that failed to render, would take them red
// too. They also cross-check each other: each realm must list ITS principal and not the other's, so a
// screen that ignored the realm entirely could not pass both.
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

    it('a container carrying no realm: is served no flow, and lists nothing', () => {
        cy.login()
        // The component is addressed on its own, in the same session the two cases above drive. A
        // container of this type is not one of the two the screen is reached through, so the render
        // carries neither a flow nor a listing. The two cases above are what keep this one honest:
        // they list through the same screen, so a screen that had stopped rendering everywhere would
        // take them red rather than leave this case passing on an empty body.
        const render = `/cms/render/default/en${componentPath}.html.ajax?ec=${uniq}`

        cy.request({ method: 'GET', url: render, failOnStatusCode: false }).then((res) => {
            const body = (res.body as string) || ''

            expect(body, 'a container carrying no realm hands out no flow').not.to.match(/webflowexecution/)
            expect(body, 'a container carrying no realm lists no principal').not.to.match(/userCheckbox/)

            // The screen also reports how many principals it withheld from the listing. That count is
            // itself a fact about a store, so with no realm resolved there is none to report.
            expect(body, 'a container carrying no realm must report no withheld principal').not.to.contain(
                'is not displayed',
            )
        })
    })
})
