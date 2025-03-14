/*
 * Copyright (C) 2002-2022 Jahia Solutions Group SA. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.jahia.modules.sitesettings.users;

import au.com.bytecode.opencsv.CSVReader;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.jahia.data.viewhelper.principal.PrincipalViewHelper;
import org.jahia.modules.sitesettings.users.management.CsvFile;
import org.jahia.modules.sitesettings.users.management.SearchCriteria;
import org.jahia.modules.sitesettings.users.management.UserProperties;
import org.jahia.services.content.*;
import org.jahia.services.content.decorator.JCRGroupNode;
import org.jahia.services.content.decorator.JCRSiteNode;
import org.jahia.services.content.decorator.JCRUserNode;
import org.jahia.services.pwdpolicy.JahiaPasswordPolicyService;
import org.jahia.services.pwdpolicy.PolicyEnforcementResult;
import org.jahia.services.render.RenderContext;
import org.jahia.services.usermanager.JahiaUserManagerService;
import org.jahia.taglibs.user.User;
import org.jahia.utils.i18n.Messages;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.binding.message.MessageBuilder;
import org.springframework.binding.message.MessageContext;
import org.springframework.context.i18n.LocaleContextHolder;

import javax.jcr.RepositoryException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Serializable;
import java.security.Principal;
import java.util.*;

/**
 * @author rincevent
 */
public class UsersFlowHandler implements Serializable {
    private static Logger logger = LoggerFactory.getLogger(UsersFlowHandler.class);
    private static final long serialVersionUID = -7240178997123886031L;

    private String siteKey;

    private transient JahiaPasswordPolicyService pwdPolicyService;

    private transient JahiaUserManagerService userManagerService;

    public void initRealm(RenderContext renderContext) throws RepositoryException {
        JCRNodeWrapper mainNode = renderContext.getMainResource().getNode();
        if (mainNode != null && mainNode.isNodeType("jnt:virtualsite")) {
            siteKey = ((JCRSiteNode) mainNode).getSiteKey();
        }
    }

    public boolean addUser(final UserProperties userProperties, final MessageContext context) throws RepositoryException {
        logger.info("Adding user");
        return JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback<Boolean>() {
            @Override
            public Boolean doInJCR(JCRSessionWrapper session) throws RepositoryException {
                JCRUserNode user = userManagerService.createUser(
                        userProperties.getUsername(), siteKey, userProperties.getPassword(), transformUserProperties(userProperties), session);
                if (user != null) {
                    session.save();
                    Locale locale = LocaleContextHolder.getLocale();
                    context.addMessage(new MessageBuilder().info().defaultText(Messages.getInternal("label.user", locale) + " '" + user.getName() + "' " + Messages.getInternal(
                            "message.successfully.created", locale)).build());
                    return true;
                } else {
                    context.addMessage(new MessageBuilder().error().code(
                            "siteSettings.user.create.unsuccessful").build());
                    return false;
                }
            }
        });
    }

    private Properties buildProperties(List<String> headerElementList, List<String> lineElementList) {
        Properties result = new Properties();
        for (int i = 0; i < headerElementList.size(); i++) {
            String currentHeader = headerElementList.get(i);
            String currentValue = lineElementList.get(i);
            if (!"j:nodename".equals(currentHeader) && !JCRUserNode.J_PASSWORD.equals(currentHeader)) {
                result.setProperty(currentHeader.trim(), currentValue);
            }
        }
        return result;
    }

    public boolean bulkAddUser(final CsvFile csvFile, final MessageContext context) throws RepositoryException {
        logger.info("Bulk adding users");

        long timer = System.currentTimeMillis();
        boolean hasErrors = JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback<Boolean>() {
            @Override
            public Boolean doInJCR(JCRSessionWrapper session) throws RepositoryException {
                CSVReader csvReader = null;
                boolean hasErrors = false;
                try {

                    csvReader = new CSVReader(new InputStreamReader(csvFile.getCsvFile().getInputStream(), "UTF-8"),
                            csvFile.getCsvSeparator().charAt(0));
                    // the first line contains the column names;
                    String[] headerElements = csvReader.readNext();
                    List<String> headerElementList = Arrays.asList(headerElements);
                    int userNamePos = headerElementList.indexOf("j:nodename");
                    int passwordPos = headerElementList.indexOf(JCRUserNode.J_PASSWORD);
                    if ((userNamePos < 0) || (passwordPos < 0)) {
                        context.addMessage(new MessageBuilder().error().code(
                                "siteSettings.users.bulk.errors.missing.mandatory").args(new String[]{"j:nodename", JCRUserNode.J_PASSWORD}).build());
                        return false;
                    }

                    String[] lineElements = null;
                    while ((lineElements = csvReader.readNext()) != null) {
                        List<String> lineElementList = Arrays.asList(lineElements);
                        Properties properties = buildProperties(headerElementList, lineElementList);
                        String userName = lineElementList.get(userNamePos);
                        String password = lineElementList.get(passwordPos);
                        if (userManagerService.userExists(userName, siteKey)) {
                             context.addMessage(new MessageBuilder().error().code(
                                   "siteSettings.users.bulk.errors.user.already.exists").arg(userName).build());
                             hasErrors = true;                        
                        } else if (userManagerService.isUsernameSyntaxCorrect(userName)) {
                            PolicyEnforcementResult evalResult = pwdPolicyService.enforcePolicyOnUserCreate(userName, password);
                            if (evalResult.isSuccess()) {
                                JCRUserNode jahiaUser = userManagerService.createUser(userName, siteKey, password, properties, session);
                                if (jahiaUser != null) {
                                    context.addMessage(new MessageBuilder().info().code(
                                            "siteSettings.users.bulk.user.creation.successful").arg(userName).build());
                                } else {
                                    context.addMessage(new MessageBuilder().error().code(
                                            "siteSettings.users.bulk.errors.user.creation.failed").arg(userName).build());
                                    hasErrors = true;
                                }
                            } else {
                                StringBuilder result = new StringBuilder("<ul>");
                                for (String msg : evalResult.getTextMessages()) {
                                    result.append("<li>").append(msg).append("</li>");
                                }
                                result.append("</ul>");
                                context.addMessage(new MessageBuilder().error().code(
                                        "siteSettings.users.bulk.errors.user.skipped.password").args(new String[]{userName, result.toString()}).build());
                                hasErrors = true;
                            }
                        } else {
                            context.addMessage(new MessageBuilder().error().code(
                                    "siteSettings.users.bulk.errors.user.skipped").arg(userName).build());
                            hasErrors = true;
                        }
                    }
                    session.save();
                } catch (IOException e) {
                    logger.error(e.getMessage(), e);
                } finally {
                    IOUtils.closeQuietly(csvReader);
                }

                return hasErrors;
            }
        });

        logger.info("Batch user create took " + (System.currentTimeMillis() - timer) + " ms");
        csvFile.setCsvFile(null);
        return !hasErrors;
    }

    public Set<JCRUserNode> init() {
        return PrincipalViewHelper.getSearchResult(null, null, null, null, null, null, false);
    }

    public SearchCriteria initCriteria() {
        return new SearchCriteria();
    }

    public CsvFile initCSVFile() {
        CsvFile csvFile = new CsvFile();
        csvFile.setCsvSeparator(",");
        return csvFile;
    }

    public UserProperties initUser() {
        UserProperties properties = new UserProperties();
        properties.setSiteKey(siteKey);
        return properties;
    }

    public UserProperties populateUser(String selectedUser) {
        UserProperties userProperties = new UserProperties();
        JCRUserNode userNode = userManagerService.lookupUserByPath(selectedUser);
        if (userNode != null) {
            userProperties.populate(userNode);
        }
        return userProperties;
    }

    public List<JCRGroupNode> getUserMembership(String selectedUser) {
        return new LinkedList<JCRGroupNode>(User.getUserMembership(selectedUser).values());
    }

    public boolean removeUser(final String userKey, final MessageContext context) throws RepositoryException {
        return JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback<Boolean>() {
            @Override
            public Boolean doInJCR(JCRSessionWrapper session) throws RepositoryException {
                JCRUserNode jahiaUser = userManagerService.lookupUserByPath(userKey);
                String displayName = PrincipalViewHelper.getDisplayName(jahiaUser);
                if (userManagerService.deleteUser(jahiaUser.getPath(), session)) {
                    context.addMessage(new MessageBuilder().info().code(
                            "siteSettings.user.remove.successful").arg(displayName).build());
                    session.save();
                    return true;
                } else {
                    context.addMessage(new MessageBuilder().error().code(
                            "siteSettings.user.remove.unsuccessful").arg(displayName).build());
                    return false;
                }
            }
        });
    }

    public Set<JCRUserNode> search(SearchCriteria searchCriteria) {
        String searchTerm = searchCriteria.getSearchString();
        if (StringUtils.isNotEmpty(searchTerm) && searchTerm.indexOf('*') == -1) {
            searchTerm += '*';
        }
        searchCriteria.setNumberOfRemovedJahiaAdministrators(0);
        Set<JCRUserNode> searchResult = PrincipalViewHelper.getSearchResult(searchCriteria.getSearchIn(),
                siteKey, searchTerm, searchCriteria.getProperties(), searchCriteria.getStoredOn(),
                searchCriteria.getProviders(), false);
        int searchSize = searchResult.size();
        searchResult = PrincipalViewHelper.removeJahiaAdministrators(searchResult);
        if (searchResult.size() != searchSize) {
            searchCriteria.setNumberOfRemovedJahiaAdministrators(searchSize - searchResult.size());
        }
        return searchResult;
    }

    @Autowired
    public void setPwdPolicyService(JahiaPasswordPolicyService pwdPolicyService) {
        this.pwdPolicyService = pwdPolicyService;
    }

    @Autowired
    public void setUserManagerService(JahiaUserManagerService userManagerService) {
        this.userManagerService = userManagerService;
    }

    private boolean setUserProperty(String propertyName, String propertyValue, String source, MessageContext context, JCRUserNode jahiaUser) {
        try {
            String oldPropertyValue = jahiaUser.getPropertyAsString(propertyName);
            if (oldPropertyValue == null && StringUtils.isNotEmpty(propertyValue) || oldPropertyValue != null && !StringUtils.equals(oldPropertyValue, propertyValue)) {
                jahiaUser.setProperty(propertyName, propertyValue);
            }
        } catch (RepositoryException e) {
            context.addMessage(new MessageBuilder().error().source(source).code("siteSettings.user.edit.errors.property").arg(source).build());
            return false;
        }
        return true;
    }

    private Properties transformUserProperties(UserProperties userProperties) {
        Properties properties = new Properties();
        properties.put("j:firstName", userProperties.getFirstName());
        properties.put("j:lastName", userProperties.getLastName());
        properties.put("j:email", userProperties.getEmail());
        properties.put("j:organization", userProperties.getOrganization());
        properties.put("preferredLanguage", userProperties.getPreferredLanguage().toString());
        properties.put("j:accountLocked", userProperties.getAccountLocked().toString());
        properties.put("emailNotificationsDisabled", userProperties.getEmailNotificationsDisabled().toString());
        return properties;
    }

    public boolean updateUser(final UserProperties userProperties, final MessageContext context) throws RepositoryException {
        logger.info("Updating user");
        return JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback<Boolean>() {
            @Override
            public Boolean doInJCR(JCRSessionWrapper session) throws RepositoryException {
                JCRUserNode jahiaUser = userManagerService.lookupUserByPath(userProperties.getUserKey(), session);
                boolean hasErrors = false;
                Set<String> readOnlyProps = userProperties.getReadOnlyProperties();
                if (jahiaUser != null) {
                    if (!readOnlyProps.contains("j:firstName")) {
                        hasErrors |= !setUserProperty("j:firstName", userProperties.getFirstName(), "firstName", context, jahiaUser);
                    }
                    if (!readOnlyProps.contains("j:lastName")) {
                        hasErrors |= !setUserProperty("j:lastName", userProperties.getLastName(), "lastName", context, jahiaUser);
                    }
                    if (!readOnlyProps.contains("j:email")) {
                        hasErrors |= !setUserProperty("j:email", userProperties.getEmail(), "email", context, jahiaUser);
                    }
                    if (!readOnlyProps.contains("j:organization")) {
                        hasErrors |= !setUserProperty("j:organization", userProperties.getOrganization(), "organization", context, jahiaUser);
                    }
                    if (!readOnlyProps.contains("emailNotificationsDisabled")) {
                        hasErrors |= !setUserProperty("emailNotificationsDisabled", userProperties.getEmailNotificationsDisabled().toString(), "emailNotifications", context, jahiaUser);
                    }
                    if (!readOnlyProps.contains("j:accountLocked")) {
                        hasErrors |= !setUserProperty("j:accountLocked", userProperties.getAccountLocked().toString(), "accountLocked", context, jahiaUser);
                         hasErrors |= !setUserProperty("j:invalidateSessionTime", String.valueOf(new Date().getTime()), "accountLocked", context, jahiaUser);
                    }
                    if (!readOnlyProps.contains("preferredLanguage")) {
                        hasErrors |= !setUserProperty("preferredLanguage", userProperties.getPreferredLanguage().toString(), "preferredLanguage", context, jahiaUser);
                    }
                    if (!userProperties.isReadOnly() && StringUtils.isNotBlank(userProperties.getPassword())) {
                        if (jahiaUser.setPassword(userProperties.getPassword())) {
                            context.addMessage(new MessageBuilder().info().code(
                                    "siteSettings.user.edit.password.changed").build());
                        } else {
                            context.addMessage(new MessageBuilder().error().source("password").code("siteSettings.user.edit.errors.password").build());
                            hasErrors = true;
                        }
                    }
                    if (!hasErrors) {
                        try {
                            session.save();
                            context.addMessage(new MessageBuilder().info().code("siteSettings.user.edit.successful").build());
                        } catch (RepositoryException e) {
                            logger.error("Cannot save user properties",e);
                        }

                    }
                }
                return !hasErrors;
            }
        });
    }

    public Set<Principal> populateUsers(String selectedUsers) {
        final String[] split = selectedUsers.split(",");
        Set<Principal> searchResult = new HashSet<Principal>();
        for (String userPath : split) {
            JCRUserNode jahiaUser = userManagerService.lookupUserByPath(userPath);
            if (jahiaUser != null) {
                searchResult.add(jahiaUser.getJahiaUser());
            }
        }
        return searchResult;
    }

    public void bulkDeleteUser(final List<String> selectedUser, final MessageContext messageContext) throws RepositoryException {
        JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback<Object>() {
            @Override
            public Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
                for (String userKey : selectedUser) {
                    removeUser(userKey, messageContext);
                }
                return null;
            }
        });
    }

    public List<String> getProvidersList() throws RepositoryException {
        return JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback<List<String>>() {
            @Override
            public List<String> doInJCR(JCRSessionWrapper session) throws RepositoryException {
                List<String> providerKeys = new ArrayList<String>();
                for(JCRStoreProvider provider : userManagerService.getProviderList(siteKey, session)){
                    providerKeys.add(provider.getKey());
                }
                return providerKeys;
            }
        });
    }
}
