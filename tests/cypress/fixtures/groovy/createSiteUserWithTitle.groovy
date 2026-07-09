import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.usermanager.JahiaUserManagerService
import javax.jcr.RepositoryException

// Create a SITE user (siteKey set, so it is listed by that site's Manage Users search) and set its
// jcr:title -> displayName. Idempotent. Tokens replaced by cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JahiaUserManagerService ums = JahiaUserManagerService.getInstance()
        def node = ums.lookupUser("USER_NAME", "SITE_KEY", session)
        if (node == null) {
            node = ums.createUser("USER_NAME", "SITE_KEY", "PASSWORD", new Properties(), session)
            session.save()
        }
        node.setProperty("jcr:title", "TITLE_VALUE")
        session.save()
        log.info("createSiteUserWithTitle: " + node.getPath())
        return null
    }
})
