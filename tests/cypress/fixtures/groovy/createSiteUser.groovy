import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.usermanager.JahiaUserManagerService
import javax.jcr.RepositoryException

// Create a SITE user (siteKey set, so it is listed/administered by that site's Manage Users screen).
// Idempotent: reuses the user when it already exists. Tokens replaced by cy.executeGroovy.
// No delete counterpart is needed: deleting the site removes its users.
JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JahiaUserManagerService ums = JahiaUserManagerService.getInstance()
        def node = ums.lookupUser("USER_NAME", "SITE_KEY", session)
        if (node == null) {
            node = ums.createUser("USER_NAME", "SITE_KEY", "PASSWORD", new Properties(), session)
            session.save()
        }
        log.info("createSiteUser: " + node.getPath())
        return null
    }
})
