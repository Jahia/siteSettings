import { deleteUser } from '@jahia/cypress'
import { SiteSettingsUsers } from '../../page-object/siteSettingsUsers'

// Migrated from ManageUsersTest#importCSVUsers of Jahia/selenium (FT-029, FT-030 of Jahia/selenium#1604).
type CsvRow = Record<string, string>

const VALID_USERS = 'csv/bulkCreateUsersValidUsers.csv'
const NO_PASSWORD = 'csv/bulkCreateUsersNoPassword.csv'
const NO_USERNAME = 'csv/bulkCreateUsersNoUsername.csv'
const MIXED = 'csv/bulkCreateUsersMixed.csv'
// the row of MIXED the import declines, as a user every Jahia already holds
const EXISTING_USER = 'root'

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
    let mixedNewUsers: CsvRow[] = []

    const readUser = (username: string) =>
        cy.apollo({
            queryFile: 'graphql/getUserImportedColumns.graphql',
            variables: { username },
        })

    const listUserUuids = () =>
        cy
            .apollo({ queryFile: 'graphql/getUsersQuery.graphql' })
            .its('data.admin.userAdmin.users.nodes')
            .then((nodes: { node: { uuid: string } }[]) => nodes.map(({ node }) => node.uuid))

    const removeUsers = () =>
        [...users, ...noPasswordUsers, ...mixedNewUsers].forEach((row) => deleteUser(row['j:nodename']))

    /* Each step of the chain is a query, so a retry reads the document again: a body captured while the
     * submit re-renders the frame would stay empty. */
    const frameBody = () => cy.get(IFRAME).its('0.contentDocument.body')

    /* The text of each alert of a kind, whole. A substring match would let "Successfully created user
     * csv1" pass on the alert of csv19 with csv1 missing. */
    const alertTexts = ($alerts: JQuery<HTMLElement>) =>
        [...$alerts].map((alert) => alert.textContent.replace('×', '').replace(/\s+/g, ' ').trim())

    // the caller waits for what the submit renders, which tells the answer from the upload view it leaves
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
        readCsv(MIXED).then((rows) => {
            mixedNewUsers = rows.filter((row) => row['j:nodename'] !== EXISTING_USER)
        })
        /* A user left by a run that never reached after() makes the next import answer "already exists",
         * so the cleanup runs before too, queued after the reads that list the users. */
        cy.login()
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

        frameBody()
            .find('.alert-success')
            .should(($alerts) => {
                const texts = alertTexts($alerts)
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

    it('creates the new users of a file whose one row is declined, and reports both on one screen', () => {
        readCsv(MIXED).then((rows) => {
            // the premise of this case: a declined row between rows the import creates
            expect(rows.map((row) => row['j:nodename'])).to.include(EXISTING_USER)
            expect(mixedNewUsers).to.have.length.greaterThan(1)
        })

        importCsv(MIXED)

        frameBody()
            .find('.alert-danger')
            .should(($alerts) => expect(alertTexts($alerts)).to.include(`User ${EXISTING_USER} already exists.`))
        frameBody()
            .find('.alert-success')
            .should(($alerts) => {
                const texts = alertTexts($alerts)
                mixedNewUsers.forEach((row) =>
                    expect(texts).to.include(`Successfully created user ${row['j:nodename']}`),
                )
            })
        // an import with errors answers on the upload view, which the file input belongs to alone
        frameBody().find('#csvFile').should('exist')

        mixedNewUsers.forEach((row) => {
            readUser(row['j:nodename'])
                .its('data.admin.userAdmin.user')
                .should((user) => {
                    expect(user.firstName).to.eq(row['j:firstName'])
                    expect(user.lastName).to.eq(row['j:lastName'])
                })
        })
        // the declined row left the existing user as it was
        readUser(EXISTING_USER).its('data.admin.userAdmin.user.lastName').should('not.eq', 'Declined')
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

            /* The users before the import, by uuid. A file without j:nodename names no user to look up, so
             * only the whole list shows that it created no one, under whatever name the import would give. */
            let uuidsBefore: string[] = []
            listUserUuids().then((uuids) => {
                expect(uuids).not.to.be.empty
                uuidsBefore = uuids
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
            // and no user appeared under any name
            listUserUuids().then((uuids) => expect(uuids).to.have.members(uuidsBefore))
        })
    })
})
