import { deleteNode } from '@jahia/cypress'
import { SiteSettingsUsers } from '../../page-object/siteSettingsUsers'

/* The columns a CSV bulk user import writes on the users it creates.
 *
 * The uploaded file states a profile column, a column of the deployment's own making, and two columns in the
 * namespaces the product reserves. The import writes the first two and leaves the last two out, so the two
 * reserved ones read back as the repository declares them rather than as the file states them.
 *
 * The first two assertions are also what keeps the last two meaningful: all four read through the same
 * property field, so a field that answered null for everything would fail the test rather than pass it.
 */
describe('Bulk create users - imported columns', () => {
    const USERNAME = 'colonel'

    const readImportedColumns = () =>
        cy.apollo({
            queryFile: 'graphql/getUserImportedColumns.graphql',
            variables: { username: USERNAME },
        })

    beforeEach(() => {
        cy.login()
    })

    after(() => {
        cy.apollo({ queryFile: 'graphql/getUsersQuery.graphql' }).then((response) => {
            const created = response.data.admin.userAdmin.users.nodes.find((user) => user.node.displayName === USERNAME)
            if (created) {
                deleteNode(created.node.uuid)
            }
        })
    })

    it('writes the profile columns and leaves the reserved ones out', () => {
        const usersPage = SiteSettingsUsers.visitGlobal()
        let bulkUserCreationPage
        cy.iframe('[src="/cms/adminframe/default/en/settings.manageUsers.html"]').within(() => {
            bulkUserCreationPage = usersPage.startBulkUserCreation()
        })
        //eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(500)
        cy.iframe('[src="/cms/adminframe/default/en/settings.manageUsers.html"]').within(() => {
            bulkUserCreationPage.setCsvFile('csv/bulkCreateUsersColumns.csv')
            bulkUserCreationPage.setSeparator(',')
            bulkUserCreationPage.save()
        })

        cy.waitUntil(() => readImportedColumns().then((response) => response.data.admin.userAdmin.user !== null), {
            timeout: 10000,
            interval: 500,
        })

        readImportedColumns().then((response) => {
            const user = response.data.admin.userAdmin.user
            // the columns the import writes, which are also what makes the two assertions below readable
            expect(user.firstName).to.eq('Colonel')
            expect(user.employeeId).to.eq('E-4711')
            // the columns the import leaves out: the account state keeps the value the repository declares,
            // and the repository namespace carries no value at all
            expect(user.accountLocked).to.eq('false')
            expect(user.title).to.eq(null)
        })
    })
})
