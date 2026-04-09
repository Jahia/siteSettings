import {
    BaseComponent,
    Button,
    createSite,
    deleteSite,
    Dropdown,
    getComponent,
    getComponentByRole,
    getComponentBySelector,
    Menu,
    Table,
} from '@jahia/cypress'
import gql from 'graphql-tag'

describe('UI Site settings language', () => {
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

    beforeEach(() => {
        cy.login()
    })
    afterEach(() => {
        cy.logout()
    })

    const visitSiteSettingsLanguages = () => {
        // visit site settings languages page
        cy.visit(`/jahia/administration/${siteKey}/settings/languages`)
    }

    it('should display settings languages', () => {
        visitSiteSettingsLanguages()

        getComponent(Table).getRows().should('have.length', languages.length)
    })

    it('should display default value', () => {
        visitSiteSettingsLanguages()

        // first row is the default language
        getComponent(Table).getRowByIndex(1).get().find('svg').first().should('have.class', 'moonstone-icon_blue')
        // not the default language
        getComponent(Table).getRowByIndex(3).get().find('svg').first().should('not.have.class', 'moonstone-icon_blue')
    })

    it('should change mixLanguage and allowsUnlistedLanguages', () => {
        visitSiteSettingsLanguages()

        // edit settings
        getComponentByRole(Button, 'edit').click()
        // change value
        getComponentBySelector(BaseComponent, 'input[type="radio"][value="only"]').should('be.visible').click()
        getComponentByRole(Button, 'save').click()
        // check label
        getComponentByRole(BaseComponent, 'unstranslatedContent-value')
            .should('have.text', 'Only for languages supported by the website')
            .should('have.attr', 'data-value', 'only')

        // reset value
        cy.apollo({
            variables: {
                path: `/sites/${siteKey}`,
                mixLanguage: true,
                allowsUnlistedLanguages: true,
            },
            mutation: gql`
                mutation ($path: String!, $mixLanguage: String!, $allowsUnlistedLanguages: String!) {
                    jcr(workspace: EDIT) {
                        mutateNode(pathOrId: $path) {
                            mixLanguage: mutateProperty(name: "j:mixLanguage") {
                                setValue(value: $mixLanguage, type: BOOLEAN)
                            }
                            allowsUnlistedLanguages: mutateProperty(name: "j:allowsUnlistedLanguages") {
                                setValue(value: $allowsUnlistedLanguages, type: BOOLEAN)
                            }
                        }
                    }
                }
            `,
        }).should((response) => expect(response.data.jcr.mutateNode.mixLanguage.setValue).to.be.true)
    })

    const changeAvailability = (rowIndex: number, item: string) => {
        getComponent(Table).getRowByIndex(rowIndex).get().find('button').last().click()
        getComponent(Menu).select('Edit')
        getComponentByRole(Dropdown, 'availability').select(item)
        getComponentByRole(Button, 'save').click()
        getComponent(Table).getRowByIndex(rowIndex).get().contains(item)
    }

    it('should change availability for the default language', () => {
        visitSiteSettingsLanguages()

        getComponent(Table).getRowByIndex(1).get().find('button').last().click()
        getComponent(Menu).select('Edit')
        const dropDown = getComponentByRole(Dropdown, 'availability')
        dropDown.get().click()
        getComponent(Menu, dropDown)
            .get()
            .find('.moonstone-menuItem')
            .contains('Inactive')
            .parent()
            .parent()
            .should('have.class', 'moonstone-disabled')
        dropDown.get().click()
        getComponentByRole(Button, 'cancel').click()

        changeAvailability(1, 'Required')
        // reset
        changeAvailability(1, 'Active')
    })

    it('should change availability for another language', () => {
        visitSiteSettingsLanguages()

        changeAvailability(3, 'Inactive')
        // reset
        changeAvailability(3, 'Active')
    })

    it('should add and delete a new language', () => {
        visitSiteSettingsLanguages()

        getComponentByRole(Button, 'addLanguage').click()
        getComponentByRole(Dropdown, 'languages').select('Afrikaans')
        getComponentByRole(Dropdown, 'availability').select('Inactive in live')
        getComponentByRole(Button, 'add').click()

        // reset
        visitSiteSettingsLanguages()
        changeAvailability(1, 'Inactive')
        getComponent(Table).getRowByIndex(1).get().find('button').last().click()
        getComponent(Menu).get().find('.moonstone-menuItem').contains('Delete').parent().parent().click()
    })

    it('should not be able to delete the default language', () => {
        visitSiteSettingsLanguages()

        getComponent(Table).getRowByIndex(2).get().find('button').last().click()
        getComponent(Menu)
            .get()
            .find('.moonstone-menuItem')
            .contains('Delete')
            .parent()
            .parent()
            .should('have.class', 'moonstone-disabled')
    })
})
