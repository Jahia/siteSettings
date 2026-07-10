import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.usermanager.JahiaGroupManagerService
import javax.jcr.RepositoryException

// Create a SITE-scoped group (/sites/<SITE_KEY>/groups/<GROUP_NAME>). Idempotent.
// Tokens replaced by cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JahiaGroupManagerService gms = JahiaGroupManagerService.getInstance()
        def grp = gms.lookupGroup("SITE_KEY", "GROUP_NAME", session)
        if (grp == null) {
            grp = gms.createGroup("SITE_KEY", "GROUP_NAME", new Properties(), false, session)
            session.save()
        }
        log.info("createSiteGroup: " + grp.getPath())
        return null
    }
})
