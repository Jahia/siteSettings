import { deleteNode } from '@jahia/cypress'
import { SiteSettingsUsers } from '../../page-object/siteSettingsUsers'
import { frameBody, manageUsersFrame } from '../../support/manageUsersFrame'

describe('Bulk Create Users XSS Prevention', () => {
    beforeEach(() => {
        cy.login()
    })

    it('should prevent XSS via CSV separator input', () => {
        const usersPage = SiteSettingsUsers.visitGlobal()
        let bulkUserCreationPage
        manageUsersFrame().within(() => {
            bulkUserCreationPage = usersPage.startBulkUserCreation()
        })
        // the file input belongs to the upload view alone
        frameBody().find('#csvFile').should('exist')
        frameBody().within(() => {
            bulkUserCreationPage.setSeparator(',<script>alert("XSS")</script>')
            bulkUserCreationPage.getSeparator().then((separator) => {
                expect(separator).to.eq(',')
            })
        })
    })

    it('should create users with valid data', () => {
        const usersPage = SiteSettingsUsers.visitGlobal()
        let bulkUserCreationPage
        manageUsersFrame().within(() => {
            bulkUserCreationPage = usersPage.startBulkUserCreation()
        })
        // the file input belongs to the upload view alone
        frameBody().find('#csvFile').should('exist')
        frameBody().within(() => {
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
})
