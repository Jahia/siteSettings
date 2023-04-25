import { createSite, deleteSite, getNodeByPath } from '@jahia/cypress'
import { LanguageSettings } from '../page-object/languageSettings'

describe('Tests on UI for language settings', () => {
    before('create sites', () => {
        createSite('languagesTestSite', {
            languages: 'ca,hu',
            templateSet: 'dx-base-demo-templates',
            serverName: 'localhost',
            locale: 'en',
        })
    })

    it('Check for Catalan website', () => {
        cy.login()
        getNodeByPath('/sites/languagesTestSite', ['j:mixLanguage']).then((result) => {
            expect(result.data.jcr.nodeByPath.properties[0].value).deep.eq('false')
        })
        const languageSettings = new LanguageSettings()
        LanguageSettings.visit('languagesTestSite', 'ca')
        languageSettings.switchReplaceUntranslatedWithDefault()
        languageSettings.submitChanges()
        getNodeByPath('/sites/languagesTestSite', ['j:mixLanguage']).then((result) => {
            expect(result.data.jcr.nodeByPath.properties[0].value).deep.eq('true')
        })
        cy.logout()
    })

    after('delete sites', () => {
        deleteSite('languagesTestSite')
    })
})
