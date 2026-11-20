import { deleteUser } from '@jahia/cypress'
import { SiteSettingsUsers } from '../../page-object/siteSettingsUsers'

/* The CSV import of the Manage Users screen, from the upload to the account it creates.
 *
 * A file of valid users creates each of them, names each one in its own success alert, writes the
 * profile columns the file states, and leaves an account that signs in with the password of the file.
 * A file without the password column, or without the user name column, creates no one, and the upload
 * view names the two mandatory columns. Migrated from ManageUsersTest#importCSVUsers of Jahia/selenium (FT-029, FT-030 of
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
const NO_USERNAME = 'csv/bulkCreateUsersNoUsername.csv'

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

    /* The body of the document the frame holds now. Each step of the chain is a query, so Cypress re-runs
     * the whole chain on every retry and reads the document again: a body captured while the frame
     * re-renders would stay empty, and an assertion on it would never pass. */
    const frameBody = () => cy.get(IFRAME).its('0.contentDocument.body')

    /* Upload a fixture and submit it. The caller waits for what the submit renders, which tells the
     * page that answers the submit from the upload page it leaves. */
    const importCsv = (fixture: string) => {
        const usersPage = SiteSettingsUsers.visitGlobal()
        let bulkUserCreationPage
        cy.iframe(IFRAME).within(() => {
            bulkUserCreationPage = usersPage.startBulkUserCreation()
        })
        // the file input belongs to the upload view alone
        frameBody().find('#csvFile').should('exist')
        frameBody().within(() => {
            bulkUserCreationPage.setCsvFile(fixture)
            bulkUserCreationPage.setSeparator(',')
            bulkUserCreationPage.save()
        })
    }

    before(() => {
        readCsv(VALID_USERS).then((rows) => {
            users = rows
        })
        readCsv(NO_PASSWORD).then((rows) => {
            noPasswordUsers = rows
        })
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

        frameBody()
            .find('.alert-success')
            .should(($alerts) => {
                const texts = [...$alerts].map((alert) =>
                    alert.textContent.replace('×', '').replace(/\s+/g, ' ').trim(),
                )
                users.forEach((row) => expect(texts).to.include(`Successfully created user ${row['j:nodename']}`))
            })

        users.forEach((row) => {
            readUser(row['j:nodename'])
                .its('data.admin.userAdmin.user')
                .should((user) => {
                    expect(user.firstName).to.eq(row['j:firstName'])
                    expect(user.lastName).to.eq(row['j:lastName'])
                })
        })

        // cy.login fails on a refused sign-in, so a password the import did not store fails here
        users.forEach((row) => {
            cy.logout()
            cy.login(row['j:nodename'], row['j:password'])
        })
        cy.logout()
    })

    /* Each file misses one of the two mandatory columns, so each case reaches its own half of the guard
     * of the import. */
    ;[
        { fixture: NO_PASSWORD, missing: 'j:password' },
        { fixture: NO_USERNAME, missing: 'j:nodename' },
    ].forEach(({ fixture, missing }) => {
        it(`creates no one from a file without ${missing} and names the mandatory columns`, () => {
            readCsv(fixture).then((rows) => {
                // the premise of this case, stated where a fixture that gains the column would break it
                expect(rows).to.have.length.greaterThan(0)
                expect(Object.keys(rows[0])).not.to.include(missing)
            })

            importCsv(fixture)

            // the error only the submit renders, which is also the wait for that render
            frameBody()
                .find('.alert-danger, .alert-error')
                .should(($alerts) => {
                    const texts = [...$alerts].map((alert) => alert.textContent.replace(/\s+/g, ' '))
                    expect(texts.join(' ')).to.contain(
                        'The uploaded file is missing either j:nodename or j:password mandatory columns',
                    )
                })
            // the file input belongs to the upload view alone, so the flow stayed on it
            frameBody().find('#csvFile').should('exist')

            // a row that names a user did not create it
            readCsv(fixture).then((rows) => {
                rows.filter((row) => row['j:nodename']).forEach((row) => {
                    readUser(row['j:nodename']).its('data.admin.userAdmin.user').should('eq', null)
                })
            })
        })
    })
})
