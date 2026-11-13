import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.usermanager.JahiaGroupManagerService
import org.jahia.services.usermanager.JahiaUserManagerService
import javax.jcr.RepositoryException
import java.util.Base64

// Create, in site SITE_KEY: a user and a group whose names are supplied base64-encoded (so they can carry
// any character a JCR name allows), a second user with an encoded name, and a group HOST_GROUP holding the
// first user and the encoded group as members. Idempotent. Tokens replaced by cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JahiaUserManagerService ums = JahiaUserManagerService.getInstance()
        JahiaGroupManagerService gms = JahiaGroupManagerService.getInstance()
        String memberName = new String(Base64.getDecoder().decode("MEMBER_NAME_B64"), "UTF-8")
        String candidateName = new String(Base64.getDecoder().decode("CANDIDATE_NAME_B64"), "UTF-8")
        String groupName = new String(Base64.getDecoder().decode("GROUP_NAME_B64"), "UTF-8")

        def member = ums.lookupUser(memberName, "SITE_KEY", session)
        if (member == null) {
            member = ums.createUser(memberName, "SITE_KEY", "PASSWORD", new Properties(), session)
        }
        if (ums.lookupUser(candidateName, "SITE_KEY", session) == null) {
            ums.createUser(candidateName, "SITE_KEY", "PASSWORD", new Properties(), session)
        }
        def group = gms.lookupGroup("SITE_KEY", groupName, session)
        if (group == null) {
            group = gms.createGroup("SITE_KEY", groupName, new Properties(), false, session)
        }
        def host = gms.lookupGroup("SITE_KEY", "HOST_GROUP", session)
        if (host == null) {
            host = gms.createGroup("SITE_KEY", "HOST_GROUP", new Properties(), false, session)
        }
        session.save()
        if (!host.isMember(member)) {
            host.addMember(member)
        }
        if (!host.isMember(group)) {
            host.addMember(group)
        }
        session.save()
        log.info("createSitePrincipalsWithEncodedNames: " + member.getPath() + ", " + group.getPath() + " in " + host.getPath())
        return null
    }
})
