import { createSite, deleteSite, getNodeByPath } from '@jahia/cypress'
import { SiteProperties } from '../page-object/siteProperties'

describe('Tests for site properties panel', () => {
    const siteKey = 'propertiesTestSite'

    before('create site', () => {
        createSite(siteKey, {
            languages: 'en,fr,de',
            templateSet: 'dx-base-demo-templates',
            serverName: 'localhost',
            locale: 'en',
        })
    })

    beforeEach(() => {
        cy.login()
    })

    after('delete site', () => {
        deleteSite(siteKey)
    })

    after(() => {
        cy.logout()
    })

    it('Edits site properties', () => {
        const newSiteName = 'Newname'
        const siteProps = SiteProperties.visit(siteKey)
        cy.contains(siteKey).should('be.visible')
        const contentEditor = siteProps.edit()
        const field = contentEditor.getSmallTextField('jnt:virtualsite_jcr:title')
        field.get().type(newSiteName)
        contentEditor.save()
        cy.contains(newSiteName).should('be.visible')
    })

    it('Navigates to edit languages', () => {
        const siteProps = SiteProperties.visit(siteKey)
        siteProps.editLanguages()
        cy.get(`iframe[src="/cms/editframe/default/en/sites/${siteKey}.manageLanguages.html"]`).should('be.visible')
    })
})
