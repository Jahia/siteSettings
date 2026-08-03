import { createSite, deleteSite } from '@jahia/cypress'
import { generateRandomID } from '../../utils/utils'
import { SiteSettingsUsers } from '../../page-object/siteSettingsUsers'
import { SiteSettingsGroups } from '../../page-object/siteSettingsGroups'
// Two distinct concerns are covered here: special characters in the profile fields (j:firstName /
// j:lastName), which must round-trip and render correctly, and special characters in the user name
// itself, which is constrained by a syntax validation on creation.
describe('Users and groups with special characters', () => {
    const siteKey = 'siteSettingsSite'
    const languages = ['en', 'fr', 'de']
    const username = 'user' + generateRandomID()
    const firstname = 'éÜ' + generateRandomID()
    const lastname = 'é@Ü' + generateRandomID()
    const password = 'password'
    const groupNameTest = generateRandomID()

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

    it('Create a new users with special characters and check it is displayed', () => {
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

    it('Add users with special characters to group and check display', () => {
        cy.login()

        const siteSettingsGroups = SiteSettingsGroups.visit(siteKey)
        const groupCreationPage = siteSettingsGroups.startGroupCreation()
        groupCreationPage.setGroupname(groupNameTest).save()
        siteSettingsGroups.verifyGroupNameDisplayed(groupNameTest)

        const groupmemberspage = siteSettingsGroups.openGroupByName(groupNameTest)

        groupmemberspage.startAddUsers().addUsersToSelection(username).save()

        groupmemberspage.verifyUserNameDisplayed(`${firstname} ${lastname}`)
    })

    it('should create a user with allowed special characters in the username', () => {
        cy.login()

        const specialUsername = 'user_-.@{}' + generateRandomID()

        const siteSettingsUsers = SiteSettingsUsers.visit(siteKey)
        siteSettingsUsers
            .startUserCreation()
            .setUsername(specialUsername)
            .setPassword(password)
            .setPasswordConfirm(password)
            .save()

        siteSettingsUsers.verifyUserListed(specialUsername)
    })

    it('should reject a username with not allowed special characters', () => {
        cy.login()

        SiteSettingsUsers.visit(siteKey)
            .startUserCreation()
            .setUsername('invalid#user!')
            .setPassword(password)
            .setPasswordConfirm(password)
            .save()
            .verifyErrorMessage("only characters (a..z, A..Z, 0..9, _, -, ., @, '{', '}') are valid for the user name.")
    })
})
