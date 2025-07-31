import org.jahia.services.content.JCRSessionFactory
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.decorator.JCRGroupNode
import org.jahia.services.content.decorator.JCRUserNode
import org.jahia.services.usermanager.JahiaGroupManagerService
import org.jahia.services.usermanager.JahiaUserManagerService
import org.jahia.services.usermanager.UsersGroup
import org.jahia.settings.SettingsBean

def groupService = JahiaGroupManagerService.getInstance()
def userService = JahiaUserManagerService.getInstance()
def session = JCRSessionFactory.getInstance().getCurrentUserSession("default")
Map<String, JCRUserNode> userNodes = new HashMap<>()
Map<String, JCRGroupNode> groupNodes = new HashMap<>()
// Add users
["user1", "user2", "user3", "user4"].forEach {user ->
    log.info("create user {}", user)
    userNodes.put(user, userService.createUser(user, null, 'password', new Properties(), session))
}

// Add groups
["groupA", "groupB", "groupC"].forEach {group ->
    log.info("create group {}", group)
    groupNodes.put(group, groupService.createGroup(null, group, new Properties(), false, session))
}

// Add user1 and user2 to groupA
groupNodes.get("groupA").addMember(userNodes.get("user1"))
groupNodes.get("groupA").addMember(userNodes.get("user2"))
// Add user3 and user4 to groupB
groupNodes.get("groupB").addMember(userNodes.get("user3"))
groupNodes.get("groupB").addMember(userNodes.get("user4"))
// Add groupB to groupA
groupNodes.get("groupA").addMember(groupNodes.get("groupB"))
// Add groupC to groupB
groupNodes.get("groupB").addMember(groupNodes.get("groupC"))

session.save()
