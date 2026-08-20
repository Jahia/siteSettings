import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.sites.JahiaSitesService
import javax.jcr.RepositoryException

// Remove the sites an earlier, failed run of a spec left behind: every site whose key starts with
// SITE_KEY_PREFIX. Tokens replaced by cy.executeGroovy.
List<String> stale = (List<String>) JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        def keys = []
        def sites = session.getNode("/sites").getNodes()
        while (sites.hasNext()) {
            def site = sites.nextNode()
            if (site.isNodeType("jnt:virtualsite") && site.getName().startsWith("SITE_KEY_PREFIX")) {
                keys.add(site.getName())
            }
        }
        return keys
    }
})

JahiaSitesService sitesService = JahiaSitesService.getInstance()
stale.each { key ->
    log.info("deleteSitesByPrefix: removing leftover site " + key)
    sitesService.removeSite(sitesService.getSiteByKey(key))
}
