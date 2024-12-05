
import { createSite, deleteSite } from '@jahia/cypress'
import {generateRandomID} from "../utils/utils";
import {SiteSettingsGroups} from "../page-object/siteSettingsGroups";
describe('Add user to group', () => {
    const siteKey = 'siteSettingsSite'
    const languages = ['en', 'fr', 'de']
    const userNameTest = 'user_' + generateRandomID()
    const groupNameTest = 'group_' + generateRandomID()

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

        cy.executeGroovy('groovy/createJcrUser.groovy', { USER_NAME: userNameTest,
            USER_FIRSTNAME: "user1",  USER_LASTNAME: "test", USER_SITE : siteKey })

    })

    after(function () {

        cy.executeGroovy('groovy/deleteJcrUser.groovy', { USER_NAME: userNameTest })
        deleteSite(siteKey)
    })

    it('Create a group with users', () => {
        cy.login()

        // Go to site settings and languages edit mode
        const siteSettingsGroups = SiteSettingsGroups.visit(siteKey)
        const groupCreationPage =  siteSettingsGroups.startGroupCreation()
        groupCreationPage.setGroupname(groupNameTest).save()
        const groupmemberspage = siteSettingsGroups.openGroupByName(groupNameTest)

        groupmemberspage.startAddUsers().addUsersToSelection(userNameTest).save()

        groupmemberspage.verifyUserNameDisplayed("user1 test")
    })
})
