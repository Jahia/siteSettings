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
package org.jahia.modules.sitesettings.groups;

import java.io.Serializable;
import java.util.Locale;

import org.apache.commons.lang.StringUtils;
import org.jahia.registries.ServicesRegistry;
import org.jahia.utils.i18n.Messages;
import org.springframework.binding.message.MessageBuilder;
import org.springframework.binding.message.MessageContext;
import org.springframework.binding.validation.ValidationContext;
import org.springframework.context.i18n.LocaleContextHolder;

/**
 * Represents a model for a new group.
 * 
 * @author Sergiy Shyrkov
 */
public class GroupModel implements Serializable {

    private static final long serialVersionUID = 4835608458510366337L;

    private static void addError(MessageContext context, String errorText) {
        context.addMessage(new MessageBuilder().error().source("groupname").defaultText(errorText).build());
    }

    private static void addErrorI18n(MessageContext context, String errorKey) {
        addError(context, i18n(errorKey));
    }

    private static String i18n(String label) {
        return Messages.get("resources.JahiaSiteSettings", label, LocaleContextHolder.getLocale());
    }

    @SuppressWarnings("deprecation")
    static boolean validateGroupName(String name, String siteId, MessageContext context) {
        boolean valid = false;
        if (StringUtils.isBlank(name)) {
            addErrorI18n(context, "siteSettings.groups.errors.groupname.mandatory");
        } else if (!ServicesRegistry.getInstance().getJahiaGroupManagerService().isGroupNameSyntaxCorrect(name)) {
            addErrorI18n(context, "siteSettings.groups.errors.groupname.syntax");
        } else if (ServicesRegistry.getInstance().getJahiaGroupManagerService().groupExists(siteId, name)) {
            Locale locale = LocaleContextHolder.getLocale();
            addError(
                    context,
                    i18n("siteSettings.groups.errors.groupname.unique") + " "
                            + Messages.getInternal("label.group", locale) + " '" + name + "' "
                            + i18n("siteSettings.groups.errors.groupname.exists"));
        } else {
            valid = true;
        }
        return valid;
    }

    private String groupname;

    private String siteKey;

    public GroupModel() {
        super();
    }

    public GroupModel(String siteKey) {
        this();
        this.siteKey = siteKey;
    }

    public String getGroupname() {
        return groupname;
    }

    public String getSiteKey() {
        return siteKey;
    }

    public void setGroupname(String groupname) {
        this.groupname = groupname;
    }

    public void setSiteKey(String siteKey) {
        this.siteKey = siteKey;
    }

    /**
     * Performs validation of the group name for syntax and also the group for existence.
     *
     * @param context
     *            the current validation context object
     */
    public void validateCopyGroup(ValidationContext context) {
        validateGroupName(groupname, siteKey, context.getMessageContext());
    }

    /**
     * Performs validation of the group name for syntax and also the group for existence.
     *
     * @param context
     *            the current validation context object
     */
    public void validateCreateGroup(ValidationContext context) {
        validateGroupName(groupname, siteKey, context.getMessageContext());
    }

}
