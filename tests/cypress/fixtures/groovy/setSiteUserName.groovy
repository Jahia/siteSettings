import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.usermanager.JahiaUserManagerService
import javax.jcr.RepositoryException

// Set j:firstName/j:lastName on an existing SITE user (looked up the same way
// createSiteUserWithTitle.groovy creates it). Idempotent. Tokens replaced by cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JahiaUserManagerService ums = JahiaUserManagerService.getInstance()
        def node = ums.lookupUser("USER_NAME", "SITE_KEY", session)
        if (node != null) {
            node.setProperty("j:firstName", "FIRST_NAME_VALUE")
            node.setProperty("j:lastName", "LAST_NAME_VALUE")
            session.save()
        }
        log.info("setSiteUserName: " + (node != null ? node.getPath() : "USER_NAME not found under SITE_KEY"))
        return null
    }
})
