/*
 * ==========================================================================================
 * =                   JAHIA'S DUAL LICENSING - IMPORTANT INFORMATION                       =
 * ==========================================================================================
 *
 *                                 http://www.jahia.com
 *
 *     Copyright (C) 2002-2020 Jahia Solutions Group SA. All rights reserved.
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
