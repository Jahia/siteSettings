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
    const IFRAME = '[src="/cms/adminframe/default/en/settings.manageUsers.html"]'

    const readImportedColumns = () =>
        cy.apollo({
            queryFile: 'graphql/getUserImportedColumns.graphql',
            variables: { username: USERNAME },
        })

    beforeEach(() => {
        cy.login()
    })

    /* Look the user up by its user name, never by its display name. A user's display name is its
     * jcr:title where it has one, and jcr:title is one of the columns this file supplies, so a
     * regression of the guard under test would rename the user and this hook would miss it. */
    after(() => {
        readImportedColumns().then((response) => {
            const created = response.data.admin.userAdmin.user
            if (created) {
                deleteNode(created.node.uuid)
            }
        })
    })

    it('writes the profile columns and leaves the reserved ones out', () => {
        const usersPage = SiteSettingsUsers.visitGlobal()
        let bulkUserCreationPage
        cy.iframe(IFRAME).within(() => {
            bulkUserCreationPage = usersPage.startBulkUserCreation()
        })
        //eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(500)
        cy.iframe(IFRAME).within(() => {
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

        // the screen names the columns it left out, so an administrator sees which ones carried no value
        cy.iframe(IFRAME).within(() => {
            cy.get('.alert-warning').should('contain', 'j:accountLocked').and('contain', 'jcr:title')
        })
    })

    /* A file the import cannot fully apply keeps the flow on the upload view, because the handler
     * answers false and Spring Web Flow abandons the transition. The report has to reach that view
     * too, which is the case where an administrator has the most to read. */
    it('names the columns it left out on the upload view when a row cannot be created', () => {
        const usersPage = SiteSettingsUsers.visitGlobal()
        let bulkUserCreationPage
        cy.iframe(IFRAME).within(() => {
            bulkUserCreationPage = usersPage.startBulkUserCreation()
        })
        //eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(500)
        cy.iframe(IFRAME).within(() => {
            bulkUserCreationPage.setCsvFile('csv/bulkCreateUsersColumnsWithBadRow.csv')
            bulkUserCreationPage.setSeparator(',')
            bulkUserCreationPage.save()
        })

        /* Re-query the iframe for each assertion rather than scoping one `within` around them. The
         * submit re-renders the frame, and a body captured while that render is in flight stays
         * empty for the whole scope. Each call here waits for a body of its own. */
        //eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(1000)
        // the file input belongs to the upload view alone, so the flow never reached the results view
        cy.iframe(IFRAME).find('#csvFile').should('exist')
        // the row the import declines, and the column it left out, both on the same screen
        cy.iframe(IFRAME).contains('bad!name').should('exist')
        cy.iframe(IFRAME).contains('j:accountLocked').should('exist')
    })
})
