import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.sites.JahiaSitesService
import org.jahia.services.usermanager.JahiaUserManagerService
import javax.jcr.RepositoryException

// Delete the sites, the server-global users and the roles whose name starts with PREFIX, left over by a run
// whose own cleanup failed. Tokens replaced by cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JahiaSitesService sites = JahiaSitesService.getInstance()
        sites.getSitesNodeList(session).findAll { it.siteKey.startsWith("PREFIX") }.each {
            log.info("deleteStaleFixtures: site " + it.siteKey)
            sites.removeSite(it)
        }
        JahiaUserManagerService ums = JahiaUserManagerService.getInstance()
        Properties criteria = new Properties()
        criteria.setProperty("username", "PREFIX*")
        ums.searchUsers(criteria, session).findAll { it.name.startsWith("PREFIX") }.each {
            log.info("deleteStaleFixtures: user " + it.name)
            ums.deleteUser(it.path, session)
        }
        session.getNode("/roles").getNodes().findAll { it.name.startsWith("PREFIX") }.each {
            log.info("deleteStaleFixtures: role " + it.name)
            it.remove()
        }
        session.save()
        return null
    }
})
