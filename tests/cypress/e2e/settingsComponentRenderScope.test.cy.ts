// A component this module defines renders only from inside a module, not from ordinary page content.
// The population is asked of the instance rather than listed here, so a screen added later is covered;
// a hardcoded list in this module had already rotted, naming a nodetype absent from the CND.
//
// jnt:siteLink is the control: same marker, another module, and its view is not a webflow. That last part
// matters, because core applies its own placement rule to a marked component whose view IS a webflow, so a
// flow-backed control would be refused by core and prove nothing about this filter's scope. It separates
// "scoped to this module's components" from "refuses every marked component".
import { createSite, deleteSite, createUser, deleteUser, grantRoles, publishAndWaitJobEnding } from '@jahia/cypress'
import { generateRandomID } from '../utils/utils'

describe('Settings components render only from inside a module', () => {
    const uniq = generateRandomID().replace(/[^a-z0-9]/gi, '')
    const siteKey = 'scope' + uniq
    const siteAdmin = 'scopeadmin' + uniq
    const password = 'password'

    const languages = 'en'
    const templateSet = 'templates-system'

    const moduleId = 'siteSettings'

    /** The floor under the derived population, not its extent. */
    const expectedScreens = ['jnt:siteSettingsManageUsers', 'jnt:siteSettingsManageGroups']

    const otherModuleComponent = 'jnt:siteLink'

    const area = `/sites/${siteKey}/home`
    let placed: Record<string, string> = {}

    // Read and written independently of any driving session, so read-backs report the stored state.
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

    const place = (nodeType: string, name: string) =>
        asRoot(
            `mutation{jcr(workspace:EDIT){addNode(parentPathOrId:"${area}",name:"${name}",primaryNodeType:"${nodeType}"){uuid}}}`,
        )

    const renderAnonymously = (path: string) =>
        cy.request({
            url: `/cms/render/live/en${path}.html.ajax?ec=${generateRandomID()}`,
            failOnStatusCode: false,
        })

    before(() => {
        createSite(siteKey, { languages, templateSet, serverName: 'localhost', locale: 'en' })
        createUser(siteAdmin, password)
        grantRoles(`/sites/${siteKey}`, ['site-administrator'], siteAdmin, 'USER')

        cy.executeGroovy('groovy/markedTypesOfModule.groovy', { '#MODULE_ID#': moduleId }).then((raw) => {
            const derived = String(raw || '')
                .trim()
                .split(',')
                .filter(Boolean)

            expect(derived, `${moduleId} must define marked components, or the sweep asserts over nothing`).not.to.be
                .empty
            expectedScreens.forEach((screen) => {
                expect(derived, `the derived population must contain ${screen}`).to.include(screen)
            })

            asRoot(`{jcr{nodeTypes(filter:{includeTypes:["${otherModuleComponent}"]}){nodes{name}}}}`).then((data) => {
                expect(
                    (data?.jcr?.nodeTypes?.nodes || []).map((n: { name: string }) => n.name),
                    `${otherModuleComponent} must be deployed — it is the control for module scoping`,
                ).to.include(otherModuleComponent)
            })

            const population = [...derived, otherModuleComponent]
            population.forEach((nodeType, index) => {
                place(nodeType, `c${index}${uniq}`)
            })

            // Read back rather than trusting the mutations.
            asRoot(
                `{jcr(workspace:EDIT){nodeByPath(path:"${area}"){children{nodes{name primaryNodeType{name}}}}}}`,
            ).then((data) => {
                const nodes = data?.jcr?.nodeByPath?.children?.nodes || []
                placed = {}
                nodes.forEach((n: { name: string; primaryNodeType: { name: string } }) => {
                    placed[n.primaryNodeType.name] = `${area}/${n.name}`
                })

                // Every member of the population, not just the named ones: the sweep iterates what landed,
                // so a placement that did not land would drop out of the sweep and leave the run green.
                expect(
                    population.filter((nodeType) => typeof placed[nodeType] !== 'string'),
                    'every placed type must be readable back, or the sweep quietly covers less',
                ).to.deep.eq([])

                publishAndWaitJobEnding(area, [languages])
            })
        })
    })

    after(() => {
        deleteUser(siteAdmin)
        deleteSite(siteKey)
    })

    it('serves no component this module defines from ordinary page content', () => {
        cy.logout()
        const served: string[] = []
        cy.then(() => {
            Object.entries(placed).forEach(([nodeType, path]) => {
                if (nodeType === otherModuleComponent) {
                    return
                }
                renderAnonymously(path).then((response) => {
                    // An unpublished node answers 404 with an error page, which is also flow-free.
                    expect(response.status, `${nodeType} must be reachable in live for this to mean anything`).to.eq(
                        200,
                    )
                    if (String(response.body || '').trim().length > 0) {
                        served.push(nodeType)
                    }
                })
            })
        })
        cy.then(() => {
            expect(served, 'a component this module defines must serve nothing outside a module').to.deep.eq([])
        })
    })

    it(`keeps rendering ${otherModuleComponent}, a marked component another module defines`, () => {
        cy.logout()
        cy.then(() =>
            renderAnonymously(placed[otherModuleComponent]).then((response) => {
                expect(response.status).to.eq(200)
                expect(
                    String(response.body || '').trim().length,
                    "scoping to this module is what leaves another module's components alone",
                ).to.be.greaterThan(0)
            }),
        )
    })

    it("still serves the users screen through this module's own administration route", () => {
        cy.logout()
        cy.login(siteAdmin, password)
        cy.request({
            url: `/cms/editframe/default/en/sites/${siteKey}.manageUsers.html`,
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(200)
            expect(
                String(response.body || ''),
                'the administration route must still hand out the screen it hosts',
            ).to.contain('webflowexecution')
        })
        cy.logout()
    })
})
