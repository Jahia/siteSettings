// Membership of a site group through Manage Groups: adding users of both stores and a subgroup,
// removing members in bulk, and copying a group with its members.
import { context, createSite, createUser, deleteSite, deleteUser, jfaker } from '@jahia/cypress'
import { SiteSettingsGroups } from '../../page-object/siteSettingsGroups'

describe('Manage Groups - group membership', () => {
    const prefix = 'mgmembers'
    const uniq = jfaker.string.alphanumeric({ length: 8, casing: 'lower', safe: true })
    const siteKey = prefix + uniq

    // members: two server-global users and one user of the site
    const globalUser = prefix + 'global' + uniq
    const globalUser2 = prefix + 'second' + uniq
    const siteUser = 'siteuser' + uniq

    const addUsersGroup = 'addusers' + uniq
    const removeGroup = 'bulkremove' + uniq
    const parentGroup = 'parent' + uniq
    const childGroup = 'child' + uniq
    const copySource = 'copysource' + uniq
    const copySourceChild = 'copychild' + uniq
    const copyTarget = 'copytarget' + uniq
    const emptiedGroup = 'emptied' + uniq
    const emptiedChild = 'emptiedchild' + uniq

    const addUser = (group: string, user: string) =>
        cy.executeGroovy('groovy/addMemberToGroup.groovy', {
            GROUP_SITE_KEY: siteKey,
            GROUP_NAME: group,
            MEMBER_NAME: user,
        })
    const addSubgroup = (group: string, subgroup: string) =>
        cy.executeGroovy('groovy/addSubgroupToGroup.groovy', {
            SITE_KEY: siteKey,
            GROUP_NAME: group,
            CHILD_NAME: subgroup,
        })

    before(() => {
        cy.executeGroovy('groovy/deleteStaleFixtures.groovy', { PREFIX: prefix })
        createSite(siteKey, { languages: 'en', templateSet: 'templates-system', serverName: 'localhost', locale: 'en' })
        createUser(globalUser, 'password')
        createUser(globalUser2, 'password')
        cy.executeGroovy('groovy/createSiteUserWithTitle.groovy', {
            USER_NAME: siteUser,
            SITE_KEY: siteKey,
            PASSWORD: 'password',
            TITLE_VALUE: siteUser,
        })
        ;[
            addUsersGroup,
            removeGroup,
            parentGroup,
            childGroup,
            copySource,
            copySourceChild,
            emptiedGroup,
            emptiedChild,
        ].forEach((group) =>
            cy.executeGroovy('groovy/createSiteGroup.groovy', { SITE_KEY: siteKey, GROUP_NAME: group }),
        )

        addUser(removeGroup, globalUser)
        addUser(removeGroup, globalUser2)
        addUser(copySource, globalUser)
        addUser(copySource, globalUser2)
        addSubgroup(copySource, copySourceChild)
        addUser(emptiedGroup, globalUser)
        addUser(emptiedGroup, globalUser2)
        addSubgroup(emptiedGroup, emptiedChild)
    })

    beforeEach(() => {
        cy.login()
    })

    after(() => {
        deleteUser(globalUser)
        deleteUser(globalUser2)
        deleteSite(siteKey)
    })

    it('FT-007: adds a server-global user and a user of the site as members', () => {
        context.tag('manage-groups', 'add-user-members')
        const members = SiteSettingsGroups.visit(siteKey).openGroupByName(addUsersGroup)
        members.startAddUsers().selectCandidate(globalUser).selectCandidate(siteUser).save()

        members.verifySuccessMessage(`Group '${addUsersGroup}' successfully updated`)
        members.verifyMemberListed(globalUser).verifyMemberListed(siteUser)
    })

    it('FT-008: removes the selected members with the bulk remove action', () => {
        context.tag('manage-groups', 'bulk-remove-members')
        const confirm = cy.stub().returns(true)
        cy.on('window:confirm', confirm)

        const members = SiteSettingsGroups.visit(siteKey).openGroupByName(removeGroup)
        members.verifyMemberListed(globalUser).verifyMemberListed(globalUser2)
        members.selectMember(globalUser).selectMember(globalUser2).removeSelectedMembers()

        members.verifySuccessMessage(`Group '${removeGroup}' successfully updated`)
        cy.wrap(confirm).should(
            'have.been.calledWith',
            'Selected members will be removed from the group. Do you want to continue?',
        )
        members.verifyMemberNotListed(globalUser).verifyMemberNotListed(globalUser2)
    })

    it('FT-009: adds a group of the site as a subgroup member', () => {
        context.tag('manage-groups', 'add-subgroup')
        const members = SiteSettingsGroups.visit(siteKey).openGroupByName(parentGroup)
        members.startAddUsers().switchToGroups().selectCandidate(childGroup).save()

        members.verifySuccessMessage(`Group '${parentGroup}' successfully updated`)
        members.verifyMemberListed(childGroup)
    })

    it('FT-013: copies a group with every member of the original', () => {
        context.tag('manage-groups', 'copy-keeps-members')
        const groups = SiteSettingsGroups.visit(siteKey)
        groups.startGroupCopy(copySource).replaceGroupname(copyTarget).copy()

        groups.verifySuccessMessage(`Group '${copyTarget}' successfully created`)
        groups
            .openGroupByName(copyTarget)
            .verifyMemberListed(globalUser)
            .verifyMemberListed(globalUser2)
            .verifyMemberListed(copySourceChild)
    })

    it('FT-014: empties a group by removing its users, then its subgroup', () => {
        context.tag('manage-groups', 'remove-subgroup-member')
        const members = SiteSettingsGroups.visit(siteKey).openGroupByName(emptiedGroup)
        members.selectMember(globalUser).selectMember(globalUser2).removeSelectedMembers()
        members.verifyMemberNotListed(globalUser).verifyMemberListed(emptiedChild)

        members.selectMember(emptiedChild).removeSelectedMembers()

        members.verifyNoMember()
    })
})
