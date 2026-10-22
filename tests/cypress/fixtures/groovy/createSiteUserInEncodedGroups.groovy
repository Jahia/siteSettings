import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.usermanager.JahiaGroupManagerService
import org.jahia.services.usermanager.JahiaUserManagerService
import javax.jcr.RepositoryException
import java.util.Base64

// Create, in site SITE_KEY, the user USER_NAME and one group per entry of GROUP_NAMES_B64 (a comma-separated
// list of base64-encoded names, so a name can carry any character a JCR name allows), and make the user a
// member of each group. Idempotent. Tokens replaced by cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JahiaUserManagerService ums = JahiaUserManagerService.getInstance()
        JahiaGroupManagerService gms = JahiaGroupManagerService.getInstance()

        def user = ums.lookupUser("USER_NAME", "SITE_KEY", session)
        if (user == null) {
            user = ums.createUser("USER_NAME", "SITE_KEY", "PASSWORD", new Properties(), session)
            session.save()
        }
        "GROUP_NAMES_B64".split(",").each { encoded ->
            String groupName = new String(Base64.getDecoder().decode(encoded), "UTF-8")
            def group = gms.lookupGroup("SITE_KEY", groupName, session)
            if (group == null) {
                group = gms.createGroup("SITE_KEY", groupName, new Properties(), false, session)
                session.save()
            }
            if (!group.isMember(user)) {
                group.addMember(user)
            }
            session.save()
            log.info("createSiteUserInEncodedGroups: " + user.getPath() + " in " + group.getPath())
        }
        return null
    }
})
