import { deleteNode } from '@jahia/cypress'
import { SiteSettingsUsers } from '../page-object/siteSettingsUsers'

describe('Bulk Create Users XSS Prevention', () => {
    beforeEach(() => {
        cy.login()
    })

    it('should prevent XSS via CSV separator input', () => {
        const usersPage = SiteSettingsUsers.visitGlobal()
        let bulkUserCreationPage
        cy.iframe('[src="/cms/adminframe/default/en/settings.manageUsers.html"]').within(() => {
            bulkUserCreationPage = usersPage.startBulkUserCreation()
        })
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
        cy.iframe('[src="/cms/adminframe/default/en/settings.manageUsers.html"]').within(() => {
            bulkUserCreationPage.setCsvFile('csv/bulkCreateUsersXSS.csv')
            bulkUserCreationPage.setSeparator(',')
            bulkUserCreationPage.save()
        })
        cy.apollo({
            queryFile: 'graphql/getUsersQuery.graphql',
        }).then((response) => {
            console.log(JSON.stringify(response))
            expect(response.data.admin.userAdmin.users.nodes.some((user) => user.node.displayName === 'steven'))
            deleteNode(
                response.data.admin.userAdmin.users.nodes.find((user) => user.node.displayName === 'steven').node.uuid,
            )
        })
    })
})
