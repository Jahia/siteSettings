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
    const email = 'user@example.com'

    before(function () {
        createSite(siteKey, {
            languages: languages.join(','),
            templateSet: 'dx-base-demo-templates',
            serverName: 'localhost',
            locale: 'en',
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
            .setEmail(`  ${email}  `)
            .save()

        siteSettingsUsers.verifyUserNameDisplayed(`${firstname} ${lastname}`)
        // Verify email
        cy.get(`a[title="Edit"][href="#edit"][onclick*="/${username}"]`).click()
        cy.get('#email').invoke('val').should('eq', email)
    })
})
