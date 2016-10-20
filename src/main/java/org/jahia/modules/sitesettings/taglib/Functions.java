package org.jahia.modules.sitesettings.taglib;

import org.jahia.services.content.JCRSessionFactory;
import org.jahia.services.content.decorator.JCRGroupNode;
import org.jahia.services.content.decorator.JCRUserNode;
import org.jahia.services.render.RenderContext;
import org.jahia.services.usermanager.JahiaUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.RepositoryException;

/**
 * Created by rincevent on 2016-10-20.
 */
public class Functions {
    private static Logger logger = LoggerFactory.getLogger(Functions.class);

    public static java.lang.Boolean isUserMemberOf(Object principal, JCRGroupNode jahiaGroup, RenderContext rc) {
        String siteKey = null;
        if(!rc.getSite().getSiteKey().equals("systemsite")) {
            siteKey = rc.getSite().getSiteKey();
        }
        if (principal instanceof JCRUserNode) {
            return (((JCRUserNode) principal).isMemberOfGroup(siteKey, jahiaGroup.getName())) ? Boolean.TRUE : Boolean.FALSE;
        } else if (principal instanceof JahiaUser) {
            final JahiaUser jahiaUser = (JahiaUser) principal;
            try {
                return ((JCRUserNode) JCRSessionFactory.getInstance().getCurrentUserSession().getNode(jahiaUser.getLocalPath())).isMemberOfGroup(siteKey, jahiaGroup.getGroupKey()) ? Boolean.TRUE : Boolean.FALSE;
            } catch (RepositoryException e) {
                logger.error("User not found on system anymore while finding its group membership", e);
            }
        }
        return Boolean.FALSE;
    }
}
