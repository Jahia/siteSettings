import { createSite, deleteSite, createUser, deleteUser } from '@jahia/cypress'
import { generateRandomID } from '../../utils/utils'
import { SiteSettingsGroups } from '../../page-object/siteSettingsGroups'

describe('Manage Groups - Create / Edit members / Delete Tests', () => {
    const siteKey = 'siteSettingsGroupsSite'
    const uniq = generateRandomID().replace(/[^a-z0-9]/gi, '')

    const CREATE_GROUP = 'createGroup' + uniq
    const DELETE_GROUP = 'deleteGroup' + uniq
    const MEMBERS_GROUP = 'membersGroup' + uniq
    const MEMBER = 'grpmember' + uniq

    before(function () {
        createSite(siteKey, {
            languages: 'en',
            templateSet: 'templates-system',
            serverName: 'localhost',
            locale: 'en',
        })

        createUser(MEMBER, 'password')

        cy.executeGroovy('groovy/createSiteGroup.groovy', { SITE_KEY: siteKey, GROUP_NAME: DELETE_GROUP })
        cy.executeGroovy('groovy/createSiteGroup.groovy', { SITE_KEY: siteKey, GROUP_NAME: MEMBERS_GROUP })
        cy.executeGroovy('groovy/addMemberToGroup.groovy', {
            GROUP_SITE_KEY: siteKey,
            GROUP_NAME: MEMBERS_GROUP,
            MEMBER_NAME: MEMBER,
        })
    })

    beforeEach(function () {
        cy.login()
    })

    after(function () {
        deleteUser(MEMBER)
        deleteSite(siteKey)
    })

    it('should create a group', () => {
        const siteSettingsGroups = SiteSettingsGroups.visit(siteKey)
        siteSettingsGroups.startGroupCreation().setGroupname(CREATE_GROUP).save()

        siteSettingsGroups.verifyGroupNameDisplayed(CREATE_GROUP)
    })

    it('should delete a group', () => {
        const siteSettingsGroups = SiteSettingsGroups.visit(siteKey)
        siteSettingsGroups.verifyGroupNameDisplayed(DELETE_GROUP)
        siteSettingsGroups.deleteGroupByName(DELETE_GROUP)

        SiteSettingsGroups.visit(siteKey).verifyGroupNotListed(DELETE_GROUP)
    })

    it('should remove a member from a group', () => {
        const groupMembersPage = SiteSettingsGroups.visit(siteKey).openGroupByName(MEMBERS_GROUP)
        groupMembersPage.verifyUserNameDisplayed(MEMBER)

        groupMembersPage.removeMember(MEMBER)

        groupMembersPage.verifyUserNameNotDisplayed(MEMBER)
    })
})
