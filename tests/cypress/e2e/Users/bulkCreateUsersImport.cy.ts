import { deleteUser } from '@jahia/cypress'
import { SiteSettingsUsers } from '../../page-object/siteSettingsUsers'

/* The CSV import of the Manage Users screen, from the upload to the account it creates.
 *
 * A file of five users creates the five of them, names each one in its own success alert, writes the
 * profile columns the file states, and leaves an account that signs in with the password of the file.
 * A file without the password column creates no one, and the upload view names the two mandatory
 * columns. Migrated from ManageUsersTest#importCSVUsers of Jahia/selenium (FT-029, FT-030 of
 * Jahia/selenium#1604).
 *
 * The success alerts are compared whole, never as substrings: "Successfully created user csv1" is a
 * substring of the alert of csv19, so a substring match would pass with csv1 missing.
 */
describe('Bulk create users - CSV import', () => {
    const IFRAME = '[src="/cms/adminframe/default/en/settings.manageUsers.html"]'
    // the values of csv/bulkCreateUsersFiveUsers.csv
    const PASSWORD = 'Csv-import-1234'
    const USERS = [
        { username: 'csv1', firstName: 'Alice' },
        { username: 'csv2', firstName: 'Bob' },
        { username: 'csv19', firstName: 'Carol' },
        { username: 'csv34', firstName: 'David' },
        { username: 'csv52', firstName: 'Eve' },
    ]
    // the user of csv/bulkCreateUsersNoPassword.csv, which the import must not create
    const NO_PASSWORD_USER = 'csvnopwd'

    const readUser = (username: string) =>
        cy.apollo({
            queryFile: 'graphql/getUserImportedColumns.graphql',
            variables: { username },
        })

    const removeUsers = () => {
        USERS.forEach((user) => deleteUser(user.username))
        deleteUser(NO_PASSWORD_USER)
    }

    const importCsv = (fixture: string) => {
        const usersPage = SiteSettingsUsers.visitGlobal()
        let bulkUserCreationPage
        cy.iframe(IFRAME).within(() => {
            bulkUserCreationPage = usersPage.startBulkUserCreation()
        })
        //eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(500)
        cy.iframe(IFRAME).within(() => {
            bulkUserCreationPage.setCsvFile(fixture)
            bulkUserCreationPage.setSeparator(',')
            bulkUserCreationPage.save()
        })
        /* The submit re-renders the frame, and a body captured while that render is in flight stays
         * empty, so each assertion below queries the iframe again. */
        //eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(1000)
    }

    before(() => {
        cy.login()
        removeUsers()
    })

    beforeEach(() => {
        cy.login()
    })

    after(() => {
        cy.login()
        removeUsers()
    })

    it('creates every user of the file, reports each by name, and each account signs in', () => {
        importCsv('csv/bulkCreateUsersFiveUsers.csv')

        cy.iframe(IFRAME)
            .find('.alert-success')
            .should(($alerts) => {
                const texts = [...$alerts].map((alert) =>
                    alert.textContent.replace('×', '').replace(/\s+/g, ' ').trim(),
                )
                USERS.forEach((user) => expect(texts).to.include(`Successfully created user ${user.username}`))
            })

        USERS.forEach((user) => {
            readUser(user.username).its('data.admin.userAdmin.user.firstName').should('eq', user.firstName)
        })

        // cy.login fails on a refused sign-in, so a password the import did not store fails here
        USERS.forEach((user) => {
            cy.logout()
            cy.login(user.username, PASSWORD)
        })
        cy.logout()
    })

    it('creates no one from a file without the password column and names the mandatory columns', () => {
        importCsv('csv/bulkCreateUsersNoPassword.csv')

        // the file input belongs to the upload view alone, so the flow stayed on it
        cy.iframe(IFRAME).find('#csvFile').should('exist')
        cy.iframe(IFRAME)
            .find('.alert-danger, .alert-error')
            .should(($alerts) => {
                const texts = [...$alerts].map((alert) => alert.textContent.replace(/\s+/g, ' '))
                expect(texts.join(' ')).to.contain(
                    'The uploaded file is missing either j:nodename or j:password mandatory columns',
                )
            })

        readUser(NO_PASSWORD_USER).its('data.admin.userAdmin.user').should('eq', null)
    })
})
