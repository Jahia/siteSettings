import { createSite, deleteSite } from '@jahia/cypress'
import { generateRandomID } from '../utils/utils'
import { SiteSettingsUsers } from '../page-object/siteSettingsUsers'
import { SiteSettingsGroups } from '../page-object/siteSettingsGroups'
describe('Create user', () => {
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
})
