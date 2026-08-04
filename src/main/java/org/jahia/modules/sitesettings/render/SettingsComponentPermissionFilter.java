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
package org.jahia.modules.sitesettings.render;

import org.apache.commons.lang.StringUtils;
import org.jahia.services.content.JCRNodeWrapper;
import org.jahia.services.render.RenderContext;
import org.jahia.services.render.Resource;
import org.jahia.services.render.filter.AbstractFilter;
import org.jahia.services.render.filter.RenderChain;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Renders a settings component only when the caller holds an administration permission on the resource the
 * request is actually made against.
 * <p>
 * The permission requirement belongs on the component, not only on the settings template that normally hosts
 * it ({@code j:requiredPermissionNames}): a component's access rule should travel with the component and hold
 * on every render path, regardless of where the component is placed. This filter makes the requirement a
 * property of the component so it applies uniformly. Because {@code WebflowAction} re-enters the render chain
 * for each webflow POST, it covers every transition too, not just the initial GET.
 * <p>
 * The check is evaluated against the <strong>main resource</strong> of the render, not against the component
 * node, and that is load-bearing rather than incidental: the component node of a legitimate settings screen
 * lives inside its module ({@code /modules/...}), where a site-scoped administrator holds nothing, while the
 * main resource is the site (site-settings route) or the global settings node (server-administration route) —
 * which is what the corresponding administrator role is actually granted on. Checking the component node,
 * which is the obvious implementation, would refuse real site administrators.
 * <p>
 * Either {@code site-admin} or {@code admin} is accepted, since these screens are reached from both the
 * site-scoped and the server-wide administration route. Both are core permissions
 * ({@code root-permissions.xml}) granted by the {@code site-administrator} / {@code server-administrator}
 * roles; the finer per-screen permissions are contributed by this module's own {@code permissions.xml} and
 * resolve to {@code false} where they are not registered on an instance, which would fail closed for
 * administrators too. The finer requirement still applies on the administration route via the template, so
 * this filter is an additional condition and never a replacement. Failing to resolve a main resource yields
 * an empty fragment rather than a rendered component.
 * <p>
 * Registered as a Spring bean, matching how this maintenance line wires its module components; the
 * development line registers the same filter through OSGi Declarative Services.
 */
// equals/hashCode are deliberately NOT overridden for the field below: AbstractFilter defines
// equality as (concrete class, priority), which is the key RenderService.addFilter uses to replace an
// already-registered filter. Widening it to the configuration would break that re-registration.
@SuppressWarnings("java:S2160")
public class SettingsComponentPermissionFilter extends AbstractFilter {

    private static final Logger logger = LoggerFactory.getLogger(SettingsComponentPermissionFilter.class);

    private String[] requiredPermissions = new String[0];
    private String requiredPermissionsLabel = "";

    /**
     * Sets the permissions accepted by this filter, as a comma-separated list. A caller holding any
     * one of them on the main resource may render the component.
     *
     * @param requiredPermissions comma-separated list of permission names
     */
    public void setRequiredPermissions(String requiredPermissions) {
        String[] parsed = StringUtils.split(StringUtils.defaultString(requiredPermissions), ',');
        for (int i = 0; i < parsed.length; i++) {
            parsed[i] = parsed[i].trim();
        }
        this.requiredPermissions = parsed;
        this.requiredPermissionsLabel = StringUtils.join(parsed, ", ");
    }

    @Override
    public String prepare(RenderContext renderContext, Resource resource, RenderChain chain) throws Exception {
        if (requiredPermissions.length == 0) {
            logger.error("No permission configured for {}; refusing to render {}",
                    getClass().getName(), resource.getNodePath());
            return StringUtils.EMPTY;
        }

        Resource mainResource = renderContext.getMainResource();
        JCRNodeWrapper contextNode = mainResource != null ? mainResource.getNode() : null;
        if (contextNode == null) {
            logger.warn("No main resource to evaluate {} against; not rendering it", resource.getNodePath());
            return StringUtils.EMPTY;
        }

        for (String permission : requiredPermissions) {
            if (contextNode.hasPermission(permission)) {
                return null;
            }
        }

        if (logger.isWarnEnabled()) {
            logger.warn("Not rendering {}: {} holds none of {} on {}", resource.getNodePath(),
                    renderContext.getUser() != null ? renderContext.getUser().getName() : "the current user",
                    requiredPermissionsLabel, contextNode.getPath());
        }
        return StringUtils.EMPTY;
    }
}
