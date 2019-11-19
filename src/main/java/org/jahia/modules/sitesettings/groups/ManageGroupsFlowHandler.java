/*
 * ==========================================================================================
 * =                   JAHIA'S DUAL LICENSING - IMPORTANT INFORMATION                       =
 * ==========================================================================================
 *
 *                                 http://www.jahia.com
 *
 *     Copyright (C) 2002-2019 Jahia Solutions Group SA. All rights reserved.
 *
 *     THIS FILE IS AVAILABLE UNDER TWO DIFFERENT LICENSES:
 *     1/GPL OR 2/JSEL
 *
 *     1/ GPL
 *     ==================================================================================
 *
 *     IF YOU DECIDE TO CHOOSE THE GPL LICENSE, YOU MUST COMPLY WITH THE FOLLOWING TERMS:
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 *
 *     2/ JSEL - Commercial and Supported Versions of the program
 *     ===================================================================================
 *
 *     IF YOU DECIDE TO CHOOSE THE JSEL LICENSE, YOU MUST COMPLY WITH THE FOLLOWING TERMS:
 *
 *     Alternatively, commercial and supported versions of the program - also known as
 *     Enterprise Distributions - must be used in accordance with the terms and conditions
 *     contained in a separate written agreement between you and Jahia Solutions Group SA.
 *
 *     If you are unsure which license is appropriate for your use,
 *     please contact the sales department at sales@jahia.com.
 */
package org.jahia.modules.sitesettings.groups;

import org.apache.commons.lang.StringUtils;
import org.jahia.data.viewhelper.principal.PrincipalViewHelper;
import org.jahia.services.content.*;
import org.jahia.services.content.decorator.JCRGroupNode;
import org.jahia.services.content.decorator.JCRSiteNode;
import org.jahia.services.content.decorator.JCRUserNode;
import org.jahia.services.render.RenderContext;
import org.jahia.services.usermanager.*;
import org.jahia.utils.i18n.Messages;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.binding.message.MessageBuilder;
import org.springframework.binding.message.MessageContext;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.webflow.execution.RequestContext;

import javax.jcr.RepositoryException;
import javax.jcr.query.Query;
import javax.jcr.query.QueryResult;
import java.io.Serializable;
import java.util.*;

/**
 * Web flow handler for group management actions.
 * 
 * @author Sergiy Shyrkov
 */
public class ManageGroupsFlowHandler implements Serializable {

    private static final Logger logger = LoggerFactory.getLogger(ManageGroupsFlowHandler.class);

    private static final long serialVersionUID = -425326961938017713L;

    private transient JahiaGroupManagerService groupManagerService;

    private transient JahiaUserManagerService userManagerService;

    private String siteKey;

    public void initRealm(RenderContext renderContext) throws RepositoryException {
        JCRNodeWrapper mainNode = renderContext.getMainResource().getNode();
        if (mainNode != null && mainNode.isNodeType("jnt:virtualsite")) {
            siteKey = ((JCRSiteNode) mainNode).getSiteKey();
        }
    }

    /**
     * Performs the creation of a new group for the site.
     * 
     * @param group
     *            the group model object with the data for the new group
     * @param context
     *            the message context object
     * @return <code>true</code> if the group was successfully added; <code>false</code> otherwise
     */
    @SuppressWarnings("deprecation")
    public boolean addGroup(final GroupModel group, final MessageContext context) throws RepositoryException {
        final Locale locale = LocaleContextHolder.getLocale();

        return JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback<Boolean>() {
            @Override
            public Boolean doInJCR(JCRSessionWrapper session) throws RepositoryException {
                if (groupManagerService.createGroup(group.getSiteKey(), group.getGroupname(), null, false, session) != null) {
                    session.save();
                    context.addMessage(new MessageBuilder()
                            .info()
                            .defaultText(
                                    Messages.getInternal("label.group", locale) + " '" + group.getGroupname() + "' "
                                            + Messages.getInternal("message.successfully.created", locale)).build());
                    return true;
                } else {
                    context.addMessage(new MessageBuilder()
                            .error()
                            .defaultText(
                                    Messages.getWithArgs("resources.JahiaSiteSettings",
                                            "siteSettings.groups.errors.create.failed", locale, group.getGroupname())).build());
                    return false;
                }
            }
        });
    }

    /**
     * Adds the specified members to the group.
     * 
     * @param groupKey
     *            the key of the group to add members to
     * @param members
     *            the member keys to be added into the group
     * @param context
     *            the message context object
     */
    public void addMembers(String groupKey, String[] members, MessageContext context) {
        if (members.length == 0) {
            return;
        }
        JCRGroupNode group = lookupGroup(groupKey);
        logger.info("Adding members {} to group {}", members, group.getPath());
        long timer = System.currentTimeMillis();
        List<JCRNodeWrapper> candidates = new LinkedList<JCRNodeWrapper>();
        for (String member : members) {
            JCRNodeWrapper principal = lookupMember(member);
            if (principal == null) {
                logger.warn("Unable to lookup principal for key {}", member);
                continue;
            }

            // do not add group to itself and check if the principal is not yet a member of the group
            if (!group.equals(principal) && !group.isMember(principal) && (!(principal instanceof JCRGroupNode) || !((JCRGroupNode)principal).isMember(group))) {
                candidates.add(principal);
            }
        }

        if (candidates.size() > 0) {
            group.addMembers(candidates);
            logger.info("Added {} member(s) to group {} in {} ms",
                    new Object[] { candidates.size(), group.getPath(), System.currentTimeMillis() - timer });
        }

        try {
            group.getSession().save();
        } catch (RepositoryException e) {
            logger.error("Cannot save",e);
        }


        Locale locale = LocaleContextHolder.getLocale();
        context.addMessage(new MessageBuilder()
                .info()
                .defaultText(
                        Messages.getInternal("label.group", locale) + " '" + group.getName() + "' "
                                + Messages.getInternal("message.successfully.updated", locale)).build());
    }

    /**
     * Duplicates the selected group.
     * 
     * @param selectedGroupKey
     *            the key of the group to be copied
     * @param newGroup
     *            the new group model
     * @param context
     *            the message context object
     * @return <code>true</code> if the group was successfully copied; <code>false</code> otherwise
     */
    public void copyGroup(final String selectedGroupKey, final GroupModel newGroup, final MessageContext context) throws RepositoryException {
        final JCRGroupNode selectedGroup = lookupGroup(selectedGroupKey);
        final Locale locale = LocaleContextHolder.getLocale();
        if (selectedGroup == null) {
            context.addMessage(new MessageBuilder()
                    .error()
                    .defaultText(
                            Messages.getWithArgs("resources.JahiaSiteSettings",
                                    "siteSettings.groups.errors.create.failed", locale, newGroup.getGroupname()))
                    .build());
            return;
        }
        // create new group

        JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback<Boolean>() {
            @Override
            public Boolean doInJCR(JCRSessionWrapper session) throws RepositoryException {
                JCRGroupNode grp = groupManagerService.createGroup(newGroup.getSiteKey(), newGroup.getGroupname(), null, false, session);
                if (grp == null) {
                    context.addMessage(new MessageBuilder()
                            .error()
                            .defaultText(
                                    Messages.getWithArgs("resources.JahiaSiteSettings",
                                            "siteSettings.groups.errors.create.failed", locale, newGroup.getGroupname()))
                            .build());
                } else {
                    context.addMessage(new MessageBuilder()
                            .info()
                            .defaultText(
                                    Messages.getInternal("label.group", locale) + " '" + newGroup.getGroupname() + "' "
                                            + Messages.getInternal("message.successfully.created", locale)).build());
                    // copy membership
                    Collection<JCRNodeWrapper> members = selectedGroup.getMembers();
                    if (members.size() > 0) {
                        grp.addMembers(members);
                    }
                    session.save();
                }
                return null;
            }
        });
    }

    /**
     * Returns a map of all group providers currently registered.
     * 
     * @return a map of all group providers currently registered
     */
    public Set<String> getProviders(final boolean isUsers, final boolean includeGlobals) throws RepositoryException {
        return JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback<Set<String>>() {
            @Override
            public Set<String> doInJCR(JCRSessionWrapper session) throws RepositoryException {
                Set<String> providerKeys = new HashSet<String>();
                if(isUsers){
                    if(includeGlobals) {
                        for (JCRStoreProvider provider : userManagerService.getProviderList(session)) {
                            providerKeys.add(provider.getKey());
                        }
                    }
                    for (JCRStoreProvider provider : userManagerService.getProviderList(siteKey, session)) {
                        providerKeys.add(provider.getKey());
                    }    
                } else {
                    if(includeGlobals) {
                        for (JCRStoreProvider provider : groupManagerService.getProviderList(null, session)) {
                            providerKeys.add(provider.getKey());
                        }
                    }
                    for (JCRStoreProvider provider : groupManagerService.getProviderList(siteKey, session)) {
                        providerKeys.add(provider.getKey());
                    }
                }

                return providerKeys;
            }
        });
    }

    /**
     * Returns a set of group keys that are considered as system and cannot be deleted.
     * 
     * @param groups
     *            the set of all groups from the search
     * @return a set of group keys that are considered as system and cannot be deleted
     */
    public Set<String> getSystemGroups(Set<?> groups) {
        if (groups.isEmpty()) {
            return Collections.emptySet();
        }
        Set<String> systemGroups = new HashSet<String>();
        for (Object p : groups) {
            if (p instanceof JCRGroupNode && isReadOnly((JCRGroupNode) p)) {
                systemGroups.add(((JCRGroupNode) p).getPath());
            }
        }

        return systemGroups;
    }

    /**
     * Returns an empty (newly initialized) search criteria bean.
     * 
     * @return an empty (newly initialized) search criteria bean
     */
    public SearchCriteria initCriteria(RequestContext ctx) {
        return new SearchCriteria(siteKey);
    }

    /**
     * Returns an empty (newly initialized) group bean.
     * 
     * @return an empty (newly initialized) group bean
     */
    public GroupModel initGroup(RequestContext ctx) {
        return new GroupModel(siteKey);
    }

    private boolean isReadOnly(JCRGroupNode grp) {
        try {
            return grp.isNodeType("jmix:systemNode");
        } catch (RepositoryException e) {
            logger.error(e.getMessage(), e);
        }
        return false;
    }

    /**
     * Looks up the specified group by key.
     * 
     * @param selectedGroup
     *            the group key
     * @return up the specified group by key
     */
    public JCRGroupNode lookupGroup(String selectedGroup) {
        return selectedGroup != null ? groupManagerService.lookupGroupByPath(selectedGroup) : null;
    }

    /**
     * Return the count of members for a group, only working on jcr groups
     * if an external group is used it will return 0
     * @param group the group to get the members from
     * @return the count of members for a group, 0 if group is external
     * @throws RepositoryException
     */
    public long lookupGroupMembersCount(JCRGroupNode group) throws RepositoryException {
        if (!group.getProperty("j:external").getBoolean()) {
            QueryResult result = group.getSession().getWorkspace().getQueryManager()
                    .createQuery("select * from [jnt:member] as member where " +
                    "isdescendantnode(member, ['" + group.getPath() + "'])", Query.JCR_SQL2).execute();
            return result.getNodes().getSize();
        }
        return 0;
    }

    /**
     * Returns the principal object for the specified key.
     * 
     * @param memberKey
     *            the principal key
     * @return the principal object for the specified key
     */
    private JCRNodeWrapper lookupMember(String memberKey) {
        JCRNodeWrapper p = null;
        if (memberKey.startsWith("u:")) {
            p = userManagerService.lookupUserByPath(StringUtils.substringAfter(memberKey, ":"));
        } else if (memberKey.startsWith("g:")) {
            p = groupManagerService.lookupGroupByPath(StringUtils.substringAfter(memberKey, ":"));
        } else {
            throw new IllegalArgumentException("Unsupported member type for member: " + memberKey);
        }

        return p;
    }

    /**
     * Performs the removal of the specified groups for the site.
     * 
     * @param selectedGroup
     *            a key of the group to be removed
     * @param context
     *            the message context object
     */
    public void removeGroup(final String selectedGroup, final MessageContext context) throws RepositoryException {
        final JCRGroupNode grp = lookupGroup(selectedGroup);
        if (isReadOnly(grp)) {
            context.addMessage(new MessageBuilder()
                    .error()
                    .defaultText(
                            Messages.get("resources.JahiaSiteSettings", "siteSettings.groups.errors.reservedGroup",
                                    LocaleContextHolder.getLocale())).build());

            return;
        } else {
            final Locale locale = LocaleContextHolder.getLocale();
            JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback<Object>() {
                @Override
                public Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
                    final String name = grp.getName();
                    if (groupManagerService.deleteGroup(grp.getPath(), session)) {
                        context.addMessage(new MessageBuilder()
                                .info()
                                .defaultText(
                                        Messages.getInternal("label.group", locale) + " '" + name + "' "
                                                + Messages.getInternal("message.successfully.removed", locale)).build());
                        session.save();
                    } else {
                        context.addMessage(new MessageBuilder()
                                .error()
                                .defaultText(
                                        Messages.getWithArgs("resources.JahiaSiteSettings",
                                                "siteSettings.groups.errors.remove.failed", locale, name))
                                .build());
                    }
                    return null;
                }
            });
        }
    }

    /**
     * Performs the removal of the specified members from the group.
     * 
     * @param groupKey
     *            the key of the group to remove members from
     * @param members
     *            the member keys to remove from the group
     * @param context
     *            the message context object
     */
    public void removeMembers(String groupKey, String[] members, MessageContext context) {
        if (members == null || members.length == 0) {
            return;
        }
        JCRGroupNode group = lookupGroup(groupKey);
        logger.info("Removing members {} from group {}", members, group.getPath());
        long timer = System.currentTimeMillis();
        int countRemoved = 0;
        for (String member : members) {
            JCRNodeWrapper principal = lookupMember(member);
            if (principal == null) {
                logger.warn("Unable to lookup principal for key {}", member);
                continue;
            }

            // check if the principal is already a member of the group
            if (group.isMember(principal)) {
                group.removeMember(principal);
                countRemoved++;
            }
        }

        try {
            group.getSession().save();
        } catch (RepositoryException e) {
            logger.error("Cannot save",e);
        }

        logger.info("Removed {} member(s) from group {} in {} ms", new Object[] { countRemoved, group.getPath(),
                System.currentTimeMillis() - timer });

        Locale locale = LocaleContextHolder.getLocale();
        if (context.getAllMessages().length == 0) {
        context.addMessage(new MessageBuilder()
                .info()
                .defaultText(
                        Messages.getInternal("label.group", locale) + " '" + group.getName() + "' "
                                + Messages.getInternal("message.successfully.updated", locale)).build());
        }
    }

    /**
     * Performs the group search.
     *
     * @return the list of groups, matching the specified search criteria
     */
    public Set<JCRGroupNode> search() {
        long timer = System.currentTimeMillis();
        Set<JCRGroupNode> searchResult = PrincipalViewHelper.getGroupSearchResult(null, siteKey, null, null, null, null, false);
        logger.info("Found {} groups in {} ms", searchResult.size(), System.currentTimeMillis() - timer);
        return searchResult;
    }

    /**
     * Performs the group search with the specified search criteria and returns the list of matching groups.
     * @return the list of groups, matching the specified search criteria
     */
    public Map<JahiaGroup, Boolean> searchNewGroupMembers(JCRGroupNode groupNode) {
        long timer = System.currentTimeMillis();

        Map<JCRGroupNode, Boolean> sortedResults = new TreeMap<>(new Comparator<JCRNodeWrapper>() {
            @Override
            public int compare(JCRNodeWrapper o1, JCRNodeWrapper o2) {
                return PrincipalViewHelper.getDisplayName(o1).compareToIgnoreCase(PrincipalViewHelper.getDisplayName(o2));
            }
        });

        Set<JCRGroupNode> groups = PrincipalViewHelper.getGroupSearchResult(null, siteKey, null, null, null, null);

        for (JCRGroupNode group : groups) {
            sortedResults.put(group, groupNode.isMember(group));
        }

        LinkedHashMap<JahiaGroup, Boolean> results = new LinkedHashMap<>();
        for (Map.Entry<JCRGroupNode, Boolean> entry : sortedResults.entrySet()) {
            results.put(entry.getKey().getJahiaGroup(), entry.getValue());
        }

        logger.info("Found {} groups in {} ms", new Object[] { results.size(), System.currentTimeMillis() - timer });
        return results;
    }

    public Map<JahiaUser, Boolean> searchNewUserMembers(String groupKey, SearchCriteria searchCriteria) {

        long timer = System.currentTimeMillis();

        JCRGroupNode groupNode = lookupGroup(groupKey);

        Map<JCRUserNode, Boolean> sortedResults = new TreeMap<>(new Comparator<JCRNodeWrapper>(){
            @Override
            public int compare(JCRNodeWrapper o1, JCRNodeWrapper o2) {
                return PrincipalViewHelper.getDisplayName(o1).compareToIgnoreCase(PrincipalViewHelper.getDisplayName(o2));
            }
        });

        Set<JCRUserNode> users = PrincipalViewHelper.getSearchResult(searchCriteria.getSearchIn(),
                searchCriteria.getSiteKey(), searchCriteria.getSearchString(), searchCriteria.getProperties(), searchCriteria.getStoredOn(),
                searchCriteria.getProviders());

        String groupName = groupNode.getName();
        for (JCRUserNode user : users) {
            sortedResults.put(user, user.isMemberOfGroup(siteKey, groupName));
        }

        LinkedHashMap<JahiaUser, Boolean> results = new LinkedHashMap<>();
        for (Map.Entry<JCRUserNode, Boolean> entry : sortedResults.entrySet()) {
            results.put(entry.getKey().getJahiaUser(), entry.getValue());
        }

        logger.info("Found {} users in {} ms", new Object[] { sortedResults.size(), System.currentTimeMillis() - timer });
        return results;
    }

    @Autowired
    public void setGroupManagerService(JahiaGroupManagerService groupManagerService) {
        this.groupManagerService = groupManagerService;
    }

    @Autowired
    public void setUserManagerService(JahiaUserManagerService userManagerService) {
        this.userManagerService = userManagerService;
    }
}