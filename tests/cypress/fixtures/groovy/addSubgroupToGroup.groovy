import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.usermanager.JahiaGroupManagerService
import javax.jcr.RepositoryException

// Add a SITE-scoped group (CHILD_NAME) as a member of another group of the same site
// (GROUP_NAME), both under /sites/<SITE_KEY>/groups. Idempotent. Tokens replaced by cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JahiaGroupManagerService gms = JahiaGroupManagerService.getInstance()
        def grp = gms.lookupGroup("SITE_KEY", "GROUP_NAME", session)
        def subgroup = gms.lookupGroup("SITE_KEY", "CHILD_NAME", session)
        if (grp != null && subgroup != null && !grp.isMember(subgroup)) {
            grp.addMember(subgroup)
            session.save()
        }
        log.info("addSubgroupToGroup: CHILD_NAME -> " + (grp != null ? grp.getPath() : "GROUP_NAME") +
                " (subgroup found=" + (subgroup != null) + ")")
        return null
    }
})
