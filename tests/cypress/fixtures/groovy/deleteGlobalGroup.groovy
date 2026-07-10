import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.usermanager.JahiaGroupManagerService
import javax.jcr.RepositoryException

// Delete a server-global group (/groups/<GROUP_NAME>, siteKey null) if present. Idempotent.
// Tokens replaced by cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JahiaGroupManagerService gms = JahiaGroupManagerService.getInstance()
        def grp = gms.lookupGroup(null, "GROUP_NAME", session)
        if (grp != null) {
            gms.deleteGroup(grp.getPath(), session)
            session.save()
            log.info("deleteGlobalGroup: removed GROUP_NAME")
        }
        return null
    }
})
