import gql from 'graphql-tag'
import { createSite, deleteSite } from '@jahia/cypress'

describe('GraphQL API calls', () => {
    const siteKey = 'siteSettingsSite'
    const languages = ['en', 'fr', 'de']
    const locale = 'en'

    before(() => {
        createSite(siteKey, {
            languages: languages.join(','),
            templateSet: 'dx-base-demo-templates',
            serverName: 'localhost',
            locale,
        })
    })
    after(() => {
        deleteSite(siteKey)
    })

    beforeEach(() => cy.login())
    afterEach(() => cy.logout())

    // get systemsite default locales
    it('should get systemsite default locales', () => {
        cy.apollo({
            query: gql`
                {
                    jcr(workspace: EDIT) {
                        nodeByPath(path: "/sites/${siteKey}") {
                            site {
                                languages {
                                    language
                                }
                            }
                        }
                    }
                }
            `,
        }).should((result) => {
            const data = result?.data?.jcr?.nodeByPath?.site?.languages
            expect(data).length(languages.length)
            expect(data.map((l) => l.language).sort()).to.deep.equal(languages.sort())
        })
    })

    // get JVM locales
    it('should get JVM locales', () => {
        cy.apollo({
            query: gql`
                {
                    admin {
                        availableLocales(language: "${locale}") {
                            language
                        }
                    }
                }
            `,
        }).should((result) => {
            expect(result?.data?.admin?.availableLocales).length(727)
        })
    })

    // the count(path) argument must stay scoped to the given path — a crafted value must not be
    // able to alter the query structure and count content outside that path.
    it('keeps languages count scoped to the given path (rejects crafted path breakout)', () => {
        const countFor = (path: string) =>
            cy
                .apollo({
                    errorPolicy: 'all',
                    query: gql`
                        {
                            jcr(workspace: EDIT) {
                                nodeByPath(path: "/sites/${siteKey}") {
                                    site {
                                        languages {
                                            language
                                            count(path: ${JSON.stringify(path)})
                                        }
                                    }
                                }
                            }
                        }
                    `,
                })
                .then((result) => {
                    const langs = result?.data?.jcr?.nodeByPath?.site?.languages || []
                    return langs.find((l) => l.language === locale)?.count
                })

        countFor(`/sites/${siteKey}`).then((scoped) => {
            expect(scoped, 'scoped count under the site').to.be.a('number')
            // A crafted path that tries to break out of ISDESCENDANTNODE and count the whole repository.
            // When contained, the crafted value is treated as a single (invalid) path: it yields no
            // count (null) or a query error — both fine. Only a numeric count exceeding the scoped
            // count would signal a breakout.
            countFor(`/sites/${siteKey}']) OR ISDESCENDANTNODE(['/`).then((crafted) => {
                if (typeof crafted === 'number') {
                    expect(crafted, 'crafted path must not count beyond its scope').to.be.at.most(Number(scoped))
                }
            })
        })
    })
})
