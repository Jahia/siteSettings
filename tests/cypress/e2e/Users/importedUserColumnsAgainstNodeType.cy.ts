/* The imported column set, read against the node type it describes.
 *
 * ImportedUserColumns names the jnt:user properties a CSV bulk import writes. The list is written out in
 * Java rather than derived, so a core release that adds a profile property to jnt:user would have the import
 * drop it and the screen report it as a column left out. This spec is what turns that into a red test naming
 * the new property.
 *
 * The two lists below are deliberately a second copy of the Java ones. Keeping them in step is the point:
 * whoever adds a property to jnt:user has to place it here, which is the moment to decide whether the import
 * writes it. The CND belongs to whichever core is deployed, so the reading has to happen here rather than in
 * ImportedUserColumnsTest, where a unit test could only compare the list against itself.
 */
const IMPORTED = [
    'j:firstName',
    'j:lastName',
    'j:email',
    'j:organization',
    'j:function',
    'j:title',
    'j:gender',
    'j:birthDate',
    'j:about',
    'j:skypeID',
    'j:twitterID',
    'j:facebookID',
    'j:linkedinID',
]

/* Declared by jnt:user and deliberately left out: the first six carry account or session state rather
 * than profile data, and j:picture is a weakreference to a file that a CSV cell cannot state. */
const KNOWN_NOT_IMPORTED = [
    'j:password',
    'j:external',
    'j:externalSource',
    'j:accountLocked',
    'j:invalidateSessionTime',
    'j:publicProperties',
    'j:picture',
]

describe('Bulk create users - the imported column set against jnt:user', () => {
    beforeEach(() => {
        cy.login()
    })

    it('places every j: property jnt:user declares in exactly one of the two lists', () => {
        cy.apollo({ queryFile: 'graphql/getUserNodeTypeProperties.graphql' }).then((response) => {
            const nodeType = response.data.jcr.nodeTypeByName
            // stated before the filter reads it, so a repository without the type says so
            expect(nodeType, 'the repository holds jnt:user').to.not.eq(null)

            const declared = nodeType.properties
                .filter((p) => p.declaringNodeType.name === 'jnt:user' && p.name.startsWith('j:'))
                .map((p) => p.name)

            // the liveness guard: a query that answered nothing would satisfy every assertion below
            expect(declared, 'jnt:user declares j: properties').to.have.length.greaterThan(0)

            declared.forEach((name) => {
                const imported = IMPORTED.includes(name)
                const knownNotImported = KNOWN_NOT_IMPORTED.includes(name)
                expect(
                    imported !== knownNotImported,
                    `${name} is declared by jnt:user and belongs in exactly one of IMPORTED / KNOWN_NOT_IMPORTED`,
                ).to.eq(true)
            })

            IMPORTED.concat(KNOWN_NOT_IMPORTED).forEach((name) => {
                expect(declared, `${name} is listed here and must still be declared by jnt:user`).to.include(name)
            })
        })
    })
})
