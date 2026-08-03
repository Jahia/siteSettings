import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.usermanager.JahiaGroupManagerService
import org.jahia.services.usermanager.JahiaUserManagerService
import javax.jcr.RepositoryException

// Add a SITE-scoped user (MEMBER_NAME, under /sites/<SITE_KEY>/users) as a member of a SITE-scoped
// group (/sites/<SITE_KEY>/groups/<GROUP_NAME>). Unlike addMemberToGroup.groovy — which looks up its
// member with no site key and so only resolves server-GLOBAL users (/users) — this one passes
// SITE_KEY to both lookups, which a site-scoped user needs to resolve at all. Idempotent. Tokens
// replaced by cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JahiaGroupManagerService gms = JahiaGroupManagerService.getInstance()
        JahiaUserManagerService ums = JahiaUserManagerService.getInstance()
        def grp = gms.lookupGroup("SITE_KEY", "GROUP_NAME", session)
        def member = ums.lookupUser("MEMBER_NAME", "SITE_KEY", session)
        if (grp != null && member != null && !grp.isMember(member)) {
            grp.addMember(member)
            session.save()
        }
        log.info("addSiteMemberToSiteGroup: MEMBER_NAME -> " + (grp != null ? grp.getPath() : "GROUP_NAME") +
                " (member found=" + (member != null) + ")")
        return null
    }
})
