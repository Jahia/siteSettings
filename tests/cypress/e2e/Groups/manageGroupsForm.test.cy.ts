// The group list and the create/copy form of Manage Groups: what the list shows, how it filters, and
// how the form refuses a name. Migrated from the legacy Selenium class ManageGroupsTest
// (Jahia/selenium#1636), so each test carries the tags of its row in that split.
import { context, createSite, deleteSite, jfaker } from '@jahia/cypress'
import { SiteSettingsGroups } from '../../page-object/siteSettingsGroups'

describe('Manage Groups - group list and group form', () => {
    const prefix = 'mgform'
    const uniq = jfaker.string.alphanumeric({ length: 8, casing: 'lower', safe: true })
    const siteKey = prefix + uniq
    const otherSiteKey = prefix + 'other' + uniq

    const existingGroup = 'existing' + uniq
    const emptyGroup = 'empty' + uniq
    const filteredGroup = 'filtered' + uniq

    const syntaxError = "Only characters (a..z, A..Z, 0..9, _, -, '{', '}') are valid."
    const uniqueError = (name: string) =>
        `The group name should be unique within the site. Group '${name}' already exists.`

    before(() => {
        cy.executeGroovy('groovy/deleteStaleFixtures.groovy', { PREFIX: prefix })
        createSite(siteKey, { languages: 'en', templateSet: 'templates-system', serverName: 'localhost', locale: 'en' })
        createSite(otherSiteKey, {
            languages: 'en',
            templateSet: 'templates-system',
            serverName: 'localhost',
            locale: 'en',
        })
        ;[existingGroup, emptyGroup, filteredGroup].forEach((group) =>
            cy.executeGroovy('groovy/createSiteGroup.groovy', { SITE_KEY: siteKey, GROUP_NAME: group }),
        )
    })

    beforeEach(() => {
        cy.login()
    })

    after(() => {
        deleteSite(siteKey)
        deleteSite(otherSiteKey)
    })

    it('FT-001: lists the built-in site-administrators group', () => {
        context.tag('testrail-case-2467338', 'manage-groups', 'group-list')
        SiteSettingsGroups.visit(siteKey).verifyGroupListed('site-administrators')
    })

    it('FT-002: refuses to create a group with an empty name', () => {
        context.tag('testrail-case-2467338', 'manage-groups', 'create-empty-name')
        SiteSettingsGroups.visit(siteKey).startGroupCreation().save().verifyError('Please specify a group name')
    })

    it('FT-003: refuses to create a group with forbidden characters', () => {
        context.tag('testrail-case-2467338', 'manage-groups', 'create-invalid-name')
        const invalidName = 'invalid@' + uniq
        SiteSettingsGroups.visit(siteKey)
            .startGroupCreation()
            .setGroupname(invalidName)
            .save()
            .verifyError(syntaxError)
            .cancel()
        SiteSettingsGroups.visit(siteKey).verifyGroupListed(existingGroup).verifyGroupNotListed(invalidName)
    })

    it('FT-005: refuses to create a group whose name already exists', () => {
        context.tag('testrail-case-2467338', 'manage-groups', 'create-duplicate-name')
        SiteSettingsGroups.visit(siteKey)
            .startGroupCreation()
            .setGroupname(existingGroup)
            .save()
            .verifyError(uniqueError(existingGroup))
    })

    it('FT-006: shows a new group with no member', () => {
        context.tag('testrail-case-2467338', 'manage-groups', 'empty-group')
        SiteSettingsGroups.visit(siteKey).openGroupByName(emptyGroup).verifyNoMember()
    })

    it('FT-011: refuses to copy a group to a name with forbidden characters', () => {
        context.tag('testrail-case-2467338', 'manage-groups', 'copy-invalid-name')
        SiteSettingsGroups.visit(siteKey)
            .startGroupCopy(existingGroup)
            .replaceGroupname('invalid@copy' + uniq)
            .copy()
            .verifyError(syntaxError)
    })

    it('FT-012: refuses to copy a group to its own name', () => {
        context.tag('testrail-case-2467338', 'manage-groups', 'copy-duplicate-name')
        SiteSettingsGroups.visit(siteKey)
            .startGroupCopy(existingGroup)
            .replaceGroupname(existingGroup)
            .copy()
            .verifyError(uniqueError(existingGroup))
    })

    it("FT-015: does not list a site's group in another site's group list", () => {
        context.tag('testrail-case-2467338', 'manage-groups', 'cross-site-list')
        SiteSettingsGroups.visit(siteKey).verifyGroupListed(existingGroup)
        // the other site's list is rendered, so the absence below is not an empty page
        SiteSettingsGroups.visit(otherSiteKey)
            .verifyGroupListed('site-administrators')
            .verifyGroupNotListed(existingGroup)
    })

    it('FT-018: filters the group list on the search input', () => {
        context.tag('testrail-case-2467338', 'manage-groups', 'search-filter')
        const groups = SiteSettingsGroups.visit(siteKey)
        groups.verifyGroupListed(existingGroup).verifyGroupListed('site-administrators')

        groups.filter('filtered').verifyGroupListed(filteredGroup)
        groups.verifyGroupNotListed(existingGroup).verifyGroupNotListed('site-administrators')

        groups.filter('').verifyGroupListed(filteredGroup).verifyGroupListed(existingGroup)
        groups.verifyGroupListed('site-administrators')
    })
})
