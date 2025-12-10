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
package org.jahia.modules.sitesettings.users.management;

import java.io.Serializable;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Properties;
import java.util.Set;

import org.apache.commons.lang.StringEscapeUtils;
import org.apache.commons.lang.StringUtils;
import org.jahia.api.Constants;
import org.jahia.data.viewhelper.principal.PrincipalViewHelper;
import org.jahia.exceptions.JahiaRuntimeException;
import org.jahia.registries.ServicesRegistry;
import org.jahia.services.content.*;
import org.jahia.services.content.decorator.JCRUserNode;
import org.jahia.services.content.nodetypes.ExtendedNodeType;
import org.jahia.services.content.nodetypes.NodeTypeRegistry;
import org.jahia.services.preferences.user.UserPreferencesHelper;
import org.jahia.services.pwdpolicy.JahiaPasswordPolicyService;
import org.jahia.services.pwdpolicy.PolicyEnforcementResult;
import org.jahia.services.query.QueryResultWrapper;
import org.jahia.services.usermanager.JahiaUserManagerService;
import org.jahia.utils.i18n.Messages;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.binding.message.MessageBuilder;
import org.springframework.binding.message.MessageContext;
import org.springframework.binding.validation.ValidationContext;
import org.springframework.context.i18n.LocaleContextHolder;

import javax.jcr.RepositoryException;
import javax.jcr.nodetype.NoSuchNodeTypeException;
import javax.jcr.query.Query;

/**
 * @author rincevent
 */
public class UserProperties implements Serializable {
    private static Logger logger = LoggerFactory.getLogger(UserProperties.class);
    private static final long serialVersionUID = -817961657416283232L;
    private static final String[] BASIC_USER_PROPERTIES = new String[]{"j:firstName", "j:lastName", "j:email", "j:organization", "emailNotificationsDisabled", "j:accountLocked", "preferredLanguage"};

    public static void validateCreateUser(String username, String password, String passwordConfirm, String email,
                                          String siteKey, MessageContext messages) {
        if (username == null || username.isEmpty()) {
            messages.addMessage(new MessageBuilder()
                    .error()
                    .source("username")
                    .code("siteSettings.user.errors.username.mandatory").build());
        } else if (!ServicesRegistry.getInstance().getJahiaUserManagerService().isUsernameSyntaxCorrect(username)) {
            messages.addMessage(new MessageBuilder()
                    .error()
                    .source("username")
                    .code("siteSettings.user.errors.username.syntax").build());
        } else if (siteKey == null) {
            if (ServicesRegistry.getInstance().getJahiaUserManagerService().userExists(username)) {
                messages.addMessage(new MessageBuilder()
                        .error()
                        .source("username")
                        .defaultText(Messages.getInternal("label.username", LocaleContextHolder.getLocale()) + " '" + username + "' " +
                                Messages.get("resources.JahiaSiteSettings", "siteSettings.user.errors.username.exist",
                                        LocaleContextHolder.getLocale())).build());
            } else {
                // Global check on all existing sites
                try {
                    JCRSessionWrapper session = JCRSessionFactory.getInstance().getCurrentSystemSession(null, (Locale) null, (Locale) null);
                    QueryResultWrapper result = session.getWorkspace().getQueryManager().createQuery("select * from [jnt:user] where localname()='" + JCRContentUtils.sqlEncode(username) + "'", Query.JCR_SQL2).execute();
                    if (result.getNodes().hasNext()) {
                        messages.addMessage(new MessageBuilder()
                                .error()
                                .source("username")
                                .defaultText(Messages.getInternal("label.username", LocaleContextHolder.getLocale()) + " '" + username + "' " +
                                        Messages.getWithArgs("resources.JahiaSiteSettings", "siteSettings.user.errors.username.existOnSite",
                                                LocaleContextHolder.getLocale(), ((JCRNodeWrapper)result.getNodes().nextNode()).getResolveSite().getName())).build());
                    }
                } catch (RepositoryException e) {
                    logger.error("Cannot execute query ",e);
                }
            }
        } else if (ServicesRegistry.getInstance().getJahiaUserManagerService().userExists(username, siteKey)) {
            messages.addMessage(new MessageBuilder()
                    .error()
                    .source("username")
                    .defaultText(Messages.getInternal("label.username", LocaleContextHolder.getLocale()) + " '" + username + "' " +
                            Messages.get("resources.JahiaSiteSettings", "siteSettings.user.errors.username.exist",
                                    LocaleContextHolder.getLocale())).build());
        }
        validateEmail(email, messages);

        validatePassword(username, password, passwordConfirm, messages);
    }

    public static void validateEmail(String email, MessageContext messages) {
        if (StringUtils.isNotEmpty(email)) {
            try {
                ExtendedNodeType userNodeTypeDef = NodeTypeRegistry.getInstance().getNodeType(Constants.JAHIANT_USER);
                if (!userNodeTypeDef.canSetProperty("j:email", JCRValueFactoryImpl.getInstance().createValue(email))) {
                    messages.addMessage(new MessageBuilder()
                            .error()
                            .source("email")
                            .code("siteSettings.user.errors.email").build());
                }
            } catch (NoSuchNodeTypeException e) {
                throw new JahiaRuntimeException("Validation of the user email failed", e);
            }
        }
    }

    public static void validatePassword(String username, String password, String passwordConfirm,
                                        MessageContext messages) {
        JahiaPasswordPolicyService pwdPolicyService = ServicesRegistry.getInstance().getJahiaPasswordPolicyService();
        if (StringUtils.isEmpty(password) || StringUtils.isEmpty(passwordConfirm)) {
            messages.addMessage(new MessageBuilder()
                    .error()
                    .source("password")
                    .code("siteSettings.user.errors.password.mandatory").build());
        } else {
            if (!passwordConfirm.equals(password)) {
                messages.addMessage(new MessageBuilder()
                        .error()
                        .source("passwordConfirm")
                        .code("siteSettings.user.errors.password.not.matching")
                        .build());
            } else {
                PolicyEnforcementResult evalResult = pwdPolicyService.enforcePolicyOnUserCreate(username, password);
                if (!evalResult.isSuccess()) {
                    List<String> textMessages = evalResult.getTextMessages();
                    for (String textMessage : textMessages) {
                        messages.addMessage(new MessageBuilder().error().source("password").defaultText(textMessage)
                                .build());
                    }
                }
            }
        }
    }

    public static void validatePasswordExistingUser(String userKey, String password, String passwordConfirm,
                                                    MessageContext messages) {
        JahiaPasswordPolicyService pwdPolicyService = ServicesRegistry.getInstance().getJahiaPasswordPolicyService();
        if (!StringUtils.isEmpty(password)) {
            if (!password.equals(passwordConfirm)) {
                messages.addMessage(new MessageBuilder()
                        .error()
                        .source("passwordConfirm")
                        .code("siteSettings.user.errors.password.not.matching")
                        .build());
            } else {
                JCRUserNode jahiaUser = JahiaUserManagerService.getInstance().lookupUserByPath(userKey);
                PolicyEnforcementResult evalResult = pwdPolicyService.enforcePolicyOnPasswordChange(jahiaUser,
                        password, false);
                if (!evalResult.isSuccess()) {
                    List<String> textMessages = evalResult.getTextMessages();
                    for (String textMessage : textMessages) {
                        messages.addMessage(new MessageBuilder().error().source("password").defaultText(textMessage)
                                .build());
                    }
                }
            }
        }
    }

    public static void validateUpdateUser(String userKey, String password, String passwordConfirm, String email,
                                          String siteKey, MessageContext messages) {
        validatePasswordExistingUser(userKey, password, passwordConfirm, messages);
        validateEmail(email, messages);
    }

    private Boolean accountLocked = Boolean.FALSE;

    private String displayName;
    private String email;
    private Boolean emailNotificationsDisabled = Boolean.FALSE;
    private String firstName;
    private String lastName;
    private String localPath;
    private String organization;
    private String password;
    private String passwordConfirm;
    private Locale preferredLanguage;

    private boolean readOnly;
    private boolean external;
    private String siteKey;

    private Set<String> readOnlyProperties = new HashSet<String>();

    private String userKey;

    private String username;

    public UserProperties() {
        super();
    }

    public UserProperties(String userKey) {
        this();
        setUserKey(userKey);
    }

    public Boolean getAccountLocked() {
        return accountLocked;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getEmail() {
        return email;
    }

    public Boolean getEmailNotificationsDisabled() {
        return emailNotificationsDisabled;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getLocalPath() {
        return localPath;
    }

    public String getOrganization() {
        return organization;
    }

    public String getPassword() {
        return password;
    }

    public String getPasswordConfirm() {
        return passwordConfirm;
    }

    public Locale getPreferredLanguage() {
        return preferredLanguage;
    }

    public Set<String> getReadOnlyProperties() {
        return readOnlyProperties;
    }

    public void setReadOnlyProperties(Set<String> readOnlyProperties) {
        this.readOnlyProperties = readOnlyProperties;
    }

    public String getUserKey() {
        return userKey;
    }

    public String getUsername() {
        return username;
    }

    public Properties getUserProperties() {
        Properties properties = new Properties();
        properties.setProperty("j:lastName", getLastName());
        properties.setProperty("j:firstName", getFirstName());
        properties.setProperty("j:organization", getOrganization());
        properties.setProperty("j:email", getEmail());
        return properties;
    }

    public boolean isReadOnly() {
        return readOnly;
    }

    public boolean isExternal() {
        return external;
    }

    public void setExternal(boolean external) {
        this.external = external;
    }

    public String getSiteKey() {
        return siteKey;
    }

    public void setSiteKey(String siteKey) {
        this.siteKey = siteKey;
    }

    public void setAccountLocked(Boolean accountLocked) {
        this.accountLocked = accountLocked;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public void setEmail(String email) {
        this.email = StringUtils.trim(email);
    }

    public void setEmailNotificationsDisabled(Boolean emailNotifications) {
        this.emailNotificationsDisabled = emailNotifications;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public void setLocalPath(String localPath) {
        this.localPath = localPath;
    }

    public void setOrganization(String organization) {
        this.organization = organization;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setPasswordConfirm(String passwordConfirm) {
        this.passwordConfirm = passwordConfirm;
    }

    public void setPreferredLanguage(Locale preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }

    public void setReadOnly(boolean readOnly) {
        this.readOnly = readOnly;
    }

    public void setUserKey(String userKey) {
        this.userKey = userKey;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void validateCreateUser(ValidationContext context) {
        validateCreateUser(username, password, passwordConfirm, email, siteKey, context.getMessageContext());
    }

    public void validateEditUser(ValidationContext context) {
        validateUpdateUser(userKey, password, passwordConfirm, email, siteKey, context.getMessageContext());
    }

    public void populate(JCRUserNode jahiaUser) {
        setFirstName(StringEscapeUtils.escapeXml(jahiaUser.getPropertyAsString("j:firstName")));
        setLastName(StringEscapeUtils.escapeXml(jahiaUser.getPropertyAsString("j:lastName")));
        setUsername(StringEscapeUtils.escapeXml(jahiaUser.getName()));
        setUserKey(jahiaUser.getPath());
        setEmail(StringEscapeUtils.escapeXml(jahiaUser.getPropertyAsString("j:email")));
        setOrganization(StringEscapeUtils.escapeXml(jahiaUser.getPropertyAsString("j:organization")));

        try {
            if (jahiaUser.hasProperty("emailNotificationsDisabled")) {
                setEmailNotificationsDisabled(jahiaUser.getProperty("emailNotificationsDisabled").getBoolean());
            }

            if (jahiaUser.hasProperty("j:accountLocked")) {
                setAccountLocked(jahiaUser.getProperty("j:accountLocked").getBoolean());
            }

            if (jahiaUser.hasProperty("j:external")) {
                setExternal(jahiaUser.getProperty("j:external").getBoolean());
            }
        } catch (RepositoryException e) {
            logger.debug(e.getMessage(), e);
        }

        setPreferredLanguage(UserPreferencesHelper.getPreferredLocale(jahiaUser));
        setDisplayName(StringEscapeUtils.escapeXml(PrincipalViewHelper.getDisplayName(jahiaUser, LocaleContextHolder.getLocale())));
        setLocalPath(jahiaUser.getPath());

        Set<String> readOnlyProperties = new HashSet<String>();
        for (String p : BASIC_USER_PROPERTIES) {
            if (!jahiaUser.isPropertyEditable(p)) {
                readOnlyProperties.add(p);
            }
        }
        setReadOnlyProperties(readOnlyProperties);
    }

}
