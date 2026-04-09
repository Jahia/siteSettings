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
                                siteLocales(language: "${locale}") {
                                    language
                                }
                            }
                        }
                    }
                }
            `,
        }).should((result) => {
            const data = result?.data?.jcr?.nodeByPath?.site?.siteLocales
            expect(data).length(languages.length)
            expect(data.map((l) => l.language)).to.deep.equal(languages)
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
})
