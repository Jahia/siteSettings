import { createSite, deleteSite, getNodeByPath } from '@jahia/cypress'
import { LanguageSettings } from '../page-object/languageSettings'

describe('Tests on UI for language settings', () => {
    before('create sites', () => {
        createSite('catalanTestSite', {
            languages: 'ca',
            templateSet: 'dx-base-demo-templates',
            serverName: 'localhost',
            locale: 'en',
        })
        createSite('hungarianTestSite', {
            languages: 'hu',
            templateSet: 'dx-base-demo-templates',
            serverName: 'localhost',
            locale: 'en',
        })
    })

    it('Check for Catalan website', () => {
        cy.login()
        const languageSettings = new LanguageSettings()
        LanguageSettings.visit('catalanTestSite', 'ca')
        languageSettings.SwitchReplaceUntranslatedWithDefault()
        languageSettings.SubmitChanges()
        getNodeByPath('/sites/catalanTestSite', ['j:mixLanguage']).then((result) => {
            expect(result.data.jcr.nodeByPath.properties[0].value).deep.eq('true')
        })
        cy.logout()
    })

    it('Check for Hungarian website', () => {
        cy.login()
        const languageSettings = new LanguageSettings()
        LanguageSettings.visit('hungarianTestSite', 'hu')
        languageSettings.SwitchReplaceUntranslatedWithDefault()
        languageSettings.SubmitChanges()
        getNodeByPath('/sites/hungarianTestSite', ['j:mixLanguage']).then((result) => {
            expect(result.data.jcr.nodeByPath.properties[0].value).deep.eq('true')
        })
        cy.logout()
    })

    after('delete sites', () => {
        deleteSite('catalanTestSite')
        deleteSite('hungarianTestSite')
    })
})
