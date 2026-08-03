import { createSite, deleteSite } from '@jahia/cypress'
import { generateRandomID } from '../../utils/utils'
import { SiteSettingsUsers } from '../../page-object/siteSettingsUsers'

describe('Manage Users - Create / Search / Edit / Delete Tests', () => {
    const siteKey = 'siteSettingsSite'
    const languages = ['en', 'fr', 'de']
    const password = 'TestPass12&'

    const EXISTING_USER = 'existingTestUser'
    const SEARCH_USER = 'searchTestUser'
    const EDIT_USER = 'editTestUser'
    const DELETE_USER = 'deleteTestUser'
    const REMOVE_USER = 'removeTestUser'
    const EXPORT_USER = 'exportTestUser'
    const LIVE_LOGIN_USER = 'liveLoginTestUser'
    const LIVE_DELETED_USER = 'liveDeletedTestUser'
    const fixtureUsers = [
        EXISTING_USER,
        SEARCH_USER,
        EDIT_USER,
        DELETE_USER,
        REMOVE_USER,
        EXPORT_USER,
        LIVE_LOGIN_USER,
        LIVE_DELETED_USER,
    ]

    const attemptLiveLogin = (username: string) =>
        cy.request({
            method: 'POST',
            url: '/cms/login',
            form: true,
            body: { username, password, site: siteKey },
            followRedirect: false,
            failOnStatusCode: false,
        })

    const verifySessionAuthenticated = (authenticated: boolean) =>
        cy
            .request({ url: '/start', failOnStatusCode: false })
            .its('status')
            .should('eq', authenticated ? 403 : 401)

    before(function () {
        createSite(siteKey, {
            languages: languages.join(','),
            templateSet: 'dx-base-demo-templates',
            serverName: 'localhost',
            locale: 'en',
        })

        fixtureUsers.forEach((user) => {
            cy.executeGroovy('groovy/createSiteUser.groovy', {
                USER_NAME: user,
                SITE_KEY: siteKey,
                PASSWORD: password,
            }).then((raw) => {
                if (String(raw ?? '').includes('.failed')) {
                    throw new Error(`createSiteUser failed for ${user}: ${raw}`)
                }
            })
        })
    })

    beforeEach(function () {
        cy.login()
    })

    after(function () {
        deleteSite(siteKey)
    })

    it('create a new user with all profile fields and check it is displayed', () => {
        const username = 'user' + generateRandomID()
        const firstname = generateRandomID()
        const lastname = generateRandomID()
        const email = 'user@example.com'
        const organization = 'Jahia'

        const siteSettingsUsers = SiteSettingsUsers.visit(siteKey)
        siteSettingsUsers
            .startUserCreation()
            .setUsername(username)
            .setFirstname(firstname)
            .setLastname(lastname)
            .setEmail(`  ${email}  `)
            .setOrganization(organization)
            .setPassword(password)
            .setPasswordConfirm(password)
            .save()

        siteSettingsUsers.verifyUserNameDisplayed(`${firstname} ${lastname}`)
        siteSettingsUsers.verifyUserListed(username)

        siteSettingsUsers.openUserForEdit(username).verifyEmail(email).verifyOrganization(organization)
    })

    it('should reject when password confirmation does not match', () => {
        SiteSettingsUsers.visit(siteKey)
            .startUserCreation()
            .setUsername('mismatchUser' + generateRandomID())
            .setPassword(password)
            .setPasswordConfirm('DifferentPass12&')
            .save()
            .verifyErrorMessage('Password confirmation does not match. Please try again.')
    })

    it('should create a user with preferred language set to French', () => {
        const username = 'frenchUser' + generateRandomID()

        const siteSettingsUsers = SiteSettingsUsers.visit(siteKey)
        siteSettingsUsers
            .startUserCreation()
            .setUsername(username)
            .setPassword(password)
            .setPasswordConfirm(password)
            .setPreferredLanguage('fr')
            .save()

        siteSettingsUsers.verifyUserListed(username)
        siteSettingsUsers.openUserForEdit(username).verifyPreferredLanguage('fr')
    })

    it('should reject a username that already exists on the site', () => {
        SiteSettingsUsers.visit(siteKey)
            .startUserCreation()
            .setUsername(EXISTING_USER)
            .setPassword(password)
            .setPasswordConfirm(password)
            .save()
            .verifyErrorMessage(`Username '${EXISTING_USER}' already exists`)
    })

    it('should search for a user and list it', () => {
        SiteSettingsUsers.visit(siteKey).search(SEARCH_USER).verifyUserListed(SEARCH_USER)
    })

    it('should edit a user', () => {
        SiteSettingsUsers.visit(siteKey).openUserForEdit(EDIT_USER).setOrganization('Jahia').update()

        // reopen the user and verify the organization persisted
        SiteSettingsUsers.visit(siteKey).openUserForEdit(EDIT_USER).verifyOrganization('Jahia')
    })

    it('should delete a user', () => {
        SiteSettingsUsers.visit(siteKey)
            .search(DELETE_USER)
            .selectUser(DELETE_USER)
            .removeSelectedUsers()
            .verifyUserListed(DELETE_USER)
            .confirm()

        SiteSettingsUsers.visit(siteKey).search(DELETE_USER).verifyUserNotListed(DELETE_USER)
    })

    it('should open Export or Remove, verify fields are disabled, then delete the user', () => {
        SiteSettingsUsers.visit(siteKey).openExportOrRemove(REMOVE_USER).verifyAllFieldsDisabled().delete()

        SiteSettingsUsers.visit(siteKey).search(REMOVE_USER).verifyUserNotListed(REMOVE_USER)
    })

    it('should open Export or Remove, verify fields are disabled, then export', () => {
        SiteSettingsUsers.visit(siteKey)
            .openExportOrRemove(EXPORT_USER)
            .verifyAllFieldsDisabled()
            .verifyExportLink(EXPORT_USER)
    })

    it('should let a site user log in on the live site', () => {
        cy.logout()
        verifySessionAuthenticated(false)

        attemptLiveLogin(LIVE_LOGIN_USER).its('status').should('eq', 302)

        verifySessionAuthenticated(true)
    })

    it('should stop a user deleted from the site from logging in on the live site', () => {
        cy.logout()
        attemptLiveLogin(LIVE_DELETED_USER).its('status').should('eq', 302)

        cy.login()
        SiteSettingsUsers.visit(siteKey).openExportOrRemove(LIVE_DELETED_USER).delete()
        SiteSettingsUsers.visit(siteKey).search(LIVE_DELETED_USER).verifyUserNotListed(LIVE_DELETED_USER)

        cy.logout()
        attemptLiveLogin(LIVE_DELETED_USER).its('status').should('eq', 200)
        verifySessionAuthenticated(false)
    })
})
