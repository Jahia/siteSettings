import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.usermanager.JahiaUserManagerService
import javax.jcr.RepositoryException

// Create a SITE user (siteKey set, so it lives under /sites/<SITE_KEY>/users/) and set a known
// j:firstName so a later assertion can prove the property was left untouched. Idempotent.
// Tokens replaced by cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JahiaUserManagerService ums = JahiaUserManagerService.getInstance()
        def node = ums.lookupUser("USER_NAME", "SITE_KEY", session)
        if (node == null) {
            node = ums.createUser("USER_NAME", "SITE_KEY", "PASSWORD", new Properties(), session)
            session.save()
        }
        node.setProperty("j:firstName", "FIRST_NAME_VALUE")
        session.save()
        log.info("createSiteUserWithFirstName: " + node.getPath())
        return null
    }
})
