import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.usermanager.JahiaUserManagerService
import javax.jcr.RepositoryException

userroles = ["USER_NAME":"editor"]

JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        log.info("start user creation : USER_NAME" );

        userroles.each { user, role ->
            JahiaUserManagerService userManagerService = JahiaUserManagerService.getInstance();
            java.util.Properties userProperties = new java.util.Properties()
            userProperties.setProperty("j:firstName","USER_FIRSTNAME");
            userProperties.setProperty("j:lastName","USER_LASTNAME");
            userManagerService.createUser("${user}", null, "password", userProperties, session);
            session.save();
        }
        return null;
    }
})
