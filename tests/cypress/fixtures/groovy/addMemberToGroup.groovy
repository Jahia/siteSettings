import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.usermanager.JahiaGroupManagerService
import org.jahia.services.usermanager.JahiaUserManagerService
import javax.jcr.RepositoryException

// Add a server-global user (MEMBER_NAME, looked up under /users) as a member of a group.
// The group is resolved from GROUP_SITE_KEY: the literal token "null" selects the server-global
// group store (/groups), any other value selects that site's store (/sites/<GROUP_SITE_KEY>/groups).
// Idempotent. Tokens replaced by cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JahiaGroupManagerService gms = JahiaGroupManagerService.getInstance()
        JahiaUserManagerService ums = JahiaUserManagerService.getInstance()
        def groupSiteKey = "GROUP_SITE_KEY" == "null" ? null : "GROUP_SITE_KEY"
        def grp = gms.lookupGroup(groupSiteKey, "GROUP_NAME", session)
        def member = ums.lookupUser("MEMBER_NAME", session)
        if (grp != null && member != null && !grp.isMember(member)) {
            grp.addMember(member)
            session.save()
        }
        log.info("addMemberToGroup: MEMBER_NAME -> " + (grp != null ? grp.getPath() : "GROUP_NAME"))
        return null
    }
})
