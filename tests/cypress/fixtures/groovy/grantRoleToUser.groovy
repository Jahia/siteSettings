import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import javax.jcr.RepositoryException

// Grant ROLE on NODE_PATH to the user named USER_NAME, written as the ACE "u:USER_NAME" with no
// check that the user resolves there. The grantRoles mutation refuses a site user on another site
// ("Invalid user"), so a test of the boundary between sites writes the ACE here. Tokens replaced by
// cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        def node = session.getNode("NODE_PATH")
        node.grantRoles("u:USER_NAME", ["ROLE"] as Set)
        session.save()
        log.info("grantRoleToUser: ROLE on NODE_PATH -> u:USER_NAME")
        return null
    }
})
