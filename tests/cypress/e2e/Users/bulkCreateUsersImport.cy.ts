import { deleteUser } from '@jahia/cypress'
import { SiteSettingsUsers } from '../../page-object/siteSettingsUsers'

/* The CSV import of the Manage Users screen, from the upload to the account it creates.
 *
 * A file of valid users creates each of them, names each one in its own success alert, writes the
 * profile columns the file states, and leaves an account that signs in with the password of the file.
 * A file without the password column creates no one, and the upload view names the two mandatory
 * columns. Migrated from ManageUsersTest#importCSVUsers of Jahia/selenium (FT-029, FT-030 of
 * Jahia/selenium#1604).
 *
 * The users and their values are read from the fixtures, so a fixture is the one place that lists them.
 *
 * The success alerts are compared whole, never as substrings: "Successfully created user csv1" is a
 * substring of the alert of csv19, so a substring match would pass with csv1 missing.
 */
type CsvRow = Record<string, string>

const VALID_USERS = 'csv/bulkCreateUsersValidUsers.csv'
const NO_PASSWORD = 'csv/bulkCreateUsersNoPassword.csv'

/* The rows of a CSV fixture, each keyed by the column names of the header line. The fixtures hold
 * plain values, with no quoted separator, so a split on the comma reads them. */
const readCsv = (fixture: string) =>
    cy.fixture(fixture).then((text: string) => {
        const [header, ...lines] = text.trim().split(/\r?\n/)
        const columns = header.split(',')
        return lines.map((line) => {
            const values = line.split(',')
            return columns.reduce((row, column, i) => ({ ...row, [column]: values[i] }), {} as CsvRow)
        })
    })

describe('Bulk create users - CSV import', () => {
    const IFRAME = '[src="/cms/adminframe/default/en/settings.manageUsers.html"]'

    let users: CsvRow[] = []
    let noPasswordUsers: CsvRow[] = []

    const readUser = (username: string) =>
        cy.apollo({
            queryFile: 'graphql/getUserImportedColumns.graphql',
            variables: { username },
        })

    const removeUsers = () => [...users, ...noPasswordUsers].forEach((row) => deleteUser(row['j:nodename']))

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
        readCsv(VALID_USERS).then((rows) => {
            users = rows
        })
        readCsv(NO_PASSWORD).then((rows) => {
            noPasswordUsers = rows
        })
        cy.login()
        // queued after the two reads, so it removes the users they listed
        cy.then(removeUsers)
    })

    beforeEach(() => {
        cy.login()
    })

    after(() => {
        cy.login()
        removeUsers()
    })

    it('creates every user of the file, reports each by name, and each account signs in', () => {
        // an emptied fixture would pass every loop below without checking anything
        expect(users).to.have.length.greaterThan(1)

        importCsv(VALID_USERS)

        cy.iframe(IFRAME)
            .find('.alert-success')
            .should(($alerts) => {
                const texts = [...$alerts].map((alert) =>
                    alert.textContent.replace('×', '').replace(/\s+/g, ' ').trim(),
                )
                users.forEach((row) => expect(texts).to.include(`Successfully created user ${row['j:nodename']}`))
            })

        users.forEach((row) => {
            readUser(row['j:nodename']).its('data.admin.userAdmin.user.firstName').should('eq', row['j:firstName'])
        })

        // cy.login fails on a refused sign-in, so a password the import did not store fails here
        users.forEach((row) => {
            cy.logout()
            cy.login(row['j:nodename'], row['j:password'])
        })
        cy.logout()
    })

    it('creates no one from a file without the password column and names the mandatory columns', () => {
        // the premise of this case, stated where a fixture that gains the column would break it
        expect(noPasswordUsers).to.have.length.greaterThan(0)
        expect(Object.keys(noPasswordUsers[0])).not.to.include('j:password')

        importCsv(NO_PASSWORD)

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

        noPasswordUsers.forEach((row) => {
            readUser(row['j:nodename']).its('data.admin.userAdmin.user').should('eq', null)
        })
    })
})
