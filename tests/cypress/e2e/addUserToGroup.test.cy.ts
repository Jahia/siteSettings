import { createSite, deleteSite, createUser } from '@jahia/cypress'
import { generateRandomID } from '../utils/utils'
import { SiteSettingsGroups } from '../page-object/siteSettingsGroups'
describe('Add user to group', () => {
    const siteKey = 'siteSettingsSite'
    const languages = ['en', 'fr', 'de']
    const userNameTest = 'user1_' + generateRandomID()
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

        createUser(userNameTest, 'password', [
            { name: 'j:firstName', value: 'user1' },
            { name: 'j:lastName', value: 'test' },
        ])
    })

    after(function () {
        deleteUser(userNameTest)
        deleteSite(siteKey)
    })

    it('Create a group with users check users are added', () => {
        cy.login()

        const siteSettingsGroups = SiteSettingsGroups.visit(siteKey)
        const groupCreationPage = siteSettingsGroups.startGroupCreation()
        groupCreationPage.setGroupname(groupNameTest).save()
        const groupmemberspage = siteSettingsGroups.openGroupByName(groupNameTest)

        groupmemberspage.startAddUsers().addUsersToSelection(userNameTest).save()

        groupmemberspage.verifyUserNameDisplayed('user1 test')
    })
})
