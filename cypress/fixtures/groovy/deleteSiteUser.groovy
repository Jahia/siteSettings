import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.usermanager.JahiaUserManagerService
import javax.jcr.RepositoryException

// Delete a SITE user created by createSiteUserWithTitle.groovy. Tokens replaced by cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JahiaUserManagerService ums = JahiaUserManagerService.getInstance()
        def node = ums.lookupUser("USER_NAME", "SITE_KEY", session)
        if (node != null) {
            ums.deleteUser(node.getPath(), session)
            session.save()
        }
        return null
    }
})
