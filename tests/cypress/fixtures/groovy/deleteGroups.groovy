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

// delete users
["user1", "user2", "user3", "user4"].forEach {user ->
    def userPath = userService.lookup(user)?.getPath()
    if (userPath != null) {
        log.info("delete user {}", user)
        userService.deleteUser(userPath, session)
    }
    session.save()
}

// delete groups
["groupA", "groupB", "groupC"].forEach {group ->

    def groupPath = groupService.lookupGroup(null, group)?.getPath()
    if (groupPath != null) {
        log.info("delete group {}", group)
        groupService.deleteGroup(groupPath, session)
    }
    session.save()
}
