import { deleteNode } from '@jahia/cypress'
import { SiteSettingsUsers } from '../page-object/siteSettingsUsers'

describe('Bulk Create Users XSS Prevention', () => {
    const MANAGE_USERS_FRAME = '[src="/cms/adminframe/default/en/settings.manageUsers.html"]'
    // no comma: it would split the CSV row
    const INVALID_NAME_PAYLOAD = '<img src=x onerror=window.__bulkAddMarkupExecuted=1>'

    beforeEach(() => {
        cy.login()
    })

    it('should prevent XSS via CSV separator input', () => {
        const usersPage = SiteSettingsUsers.visitGlobal()
        let bulkUserCreationPage
        cy.iframe('[src="/cms/adminframe/default/en/settings.manageUsers.html"]').within(() => {
            bulkUserCreationPage = usersPage.startBulkUserCreation()
        })
        //eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(500)
        cy.iframe('[src="/cms/adminframe/default/en/settings.manageUsers.html"]').within(() => {
            bulkUserCreationPage.setSeparator(',<script>alert("XSS")</script>')
            bulkUserCreationPage.getSeparator().then((separator) => {
                expect(separator).to.eq(',')
            })
        })
    })

    it('should create users with valid data', () => {
        const usersPage = SiteSettingsUsers.visitGlobal()
        let bulkUserCreationPage
        cy.iframe('[src="/cms/adminframe/default/en/settings.manageUsers.html"]').within(() => {
            bulkUserCreationPage = usersPage.startBulkUserCreation()
        })
        //eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(500)
        cy.iframe('[src="/cms/adminframe/default/en/settings.manageUsers.html"]').within(() => {
            bulkUserCreationPage.setCsvFile('csv/bulkCreateUsersXSS.csv')
            bulkUserCreationPage.setSeparator(',')
            bulkUserCreationPage.save()
        })
        cy.waitUntil(
            () => {
                return cy
                    .apollo({
                        queryFile: 'graphql/getUsersQuery.graphql',
                    })
                    .then((response) => {
                        const userExist = response.data.admin.userAdmin.users.nodes.some(
                            (user) => user.node.displayName === 'steven',
                        )
                        return userExist
                    })
            },
            {
                timeout: 10000,
                interval: 500,
            },
        )

        cy.apollo({
            queryFile: 'graphql/getUsersQuery.graphql',
        }).then((response) => {
            deleteNode(
                response.data.admin.userAdmin.users.nodes.find((user) => user.node.displayName === 'steven').node.uuid,
            )
        })
    })

    // A name that fails the syntax check is reported back verbatim in the "skipped" message, so it is the
    // one value on this path guaranteed not to be constrained. The message itself carries intentional
    // markup (<span style="font:bold;">{0}</span>), so only the argument may be escaped, not the message.
    it('reports a rejected user name containing markup as literal text', () => {
        const usersPage = SiteSettingsUsers.visitGlobal()
        let bulkUserCreationPage
        cy.iframe(MANAGE_USERS_FRAME).within(() => {
            bulkUserCreationPage = usersPage.startBulkUserCreation()
            cy.get('#csvFile').should('exist')
        })
        cy.iframe(MANAGE_USERS_FRAME).within(() => {
            bulkUserCreationPage.setCsvFile('csv/bulkCreateUsersInvalidName.csv')
            bulkUserCreationPage.setSeparator(',')
            bulkUserCreationPage.save()
        })

        cy.iframe(MANAGE_USERS_FRAME).within(() => {
            // the name must appear as text inside the message, not as a live element
            cy.contains('.alert', INVALID_NAME_PAYLOAD, { timeout: 10000 }).should('be.visible')
            cy.get('.alert img[onerror]').should('not.exist')
            // the message's own <span> markup must survive — it is not the argument
            cy.get('.alert span').should('exist')
        })
    })
})
