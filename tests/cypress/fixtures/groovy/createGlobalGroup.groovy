import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.usermanager.JahiaGroupManagerService
import javax.jcr.RepositoryException

// Create a server-global group (/groups/<GROUP_NAME>, siteKey null). Idempotent.
// Tokens replaced by cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JahiaGroupManagerService gms = JahiaGroupManagerService.getInstance()
        def grp = gms.lookupGroup(null, "GROUP_NAME", session)
        if (grp == null) {
            grp = gms.createGroup(null, "GROUP_NAME", new Properties(), false, session)
            session.save()
        }
        log.info("createGlobalGroup: " + grp.getPath())
        return null
    }
})
