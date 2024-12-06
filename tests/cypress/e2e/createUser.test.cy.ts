import { createSite, deleteSite } from '@jahia/cypress'
import { generateRandomID } from '../utils/utils'
import { SiteSettingsUsers } from '../page-object/siteSettingsUsers'
describe('Create user', () => {
    const siteKey = 'siteSettingsSite'
    const languages = ['en', 'fr', 'de']
    const username = 'user' + generateRandomID()
    const firstname = generateRandomID()
    const lastname = generateRandomID()
    const password = 'password'

    before(function () {
        createSite(siteKey, {
            languages: languages.join(','),
            templateSet: 'dx-base-demo-templates',
            serverName: 'localhost',
            locale: 'en',
        })
        cy.apollo({
            variables: {
                pathOrId: '/sites/' + siteKey + '/home',
            },
            mutationFile: 'graphql/createContent.graphql',
        })
    })

    after(function () {
        deleteSite(siteKey)
    })

    it('Create a new users and check it is displayed', () => {
        cy.login()

        const siteSettingsUsers = SiteSettingsUsers.visit(siteKey)
        siteSettingsUsers
            .startUserCreation()
            .setUsername(username)
            .setFirstname(firstname)
            .setLastname(lastname)
            .setPassword(password)
            .setPasswordConfirm(password)
            .save()

        siteSettingsUsers.verifyUserNameDisplayed(`${firstname} ${lastname}`)
    })
})
