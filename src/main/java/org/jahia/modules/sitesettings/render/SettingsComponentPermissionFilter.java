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
import org.jahia.services.render.filter.RenderFilter;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Renders a settings component only when the caller holds an administration permission on the resource the
 * request is actually made against.
 * <p>
 * The permission requirement belongs on the component, not only on the settings template that normally
 * hosts it ({@code j:requiredPermissionNames}): a component's access rule should travel with the component
 * and hold on every render path, regardless of where the component is placed. Because {@code WebflowAction}
 * re-enters the render chain for each webflow POST, it covers every transition too, not just the initial GET.
 * <p>
 * The check is evaluated against the <strong>main resource</strong> of the render, not against the component
 * node, and that is load-bearing rather than incidental: the component node of a <em>legitimate</em> settings
 * screen lives inside its module ({@code /modules/...}), where a site-scoped administrator holds nothing.
 * Checking the component node, which is the obvious implementation, would therefore refuse real site
 * administrators. The main resource is the site or the global settings node, which is what the corresponding
 * administrator role is actually granted on.
 * <p>
 * The accepted permissions are the COARSE core ones ({@code root-permissions.xml}); the finer per-screen
 * permissions come from a module's own {@code permissions.xml} and resolve to {@code false}
 * indistinguishably from a denial where they are not registered, which would fail closed for administrators
 * too. The finer requirement still applies on the administration route via the template, so this filter is
 * an additional condition and never a replacement. Failing to resolve a main resource yields an empty
 * fragment rather than a rendered component.
 * <p>
 * Registered via OSGi Declarative Services -- no Spring context involvement.
 */
@Component(service = RenderFilter.class, immediate = true)
public class SettingsComponentPermissionFilter extends AbstractFilter {

    private static final Logger logger = LoggerFactory.getLogger(SettingsComponentPermissionFilter.class);

    /** Node types gated by this filter -- the settings components this line actually ships. */
    private static final String APPLY_ON_NODE_TYPES =
            "jnt:siteSettingsManageUsers," +
            "jnt:siteSettingsManageGroups," +
            "jnt:siteSettingsManageModules," +
            "jnt:siteSettingsManagePageModels," +
            "jnt:siteSettingsWcagCompliance";

    /** Any one of these on the main resource is sufficient. */
    private static final List<String> REQUIRED_PERMISSIONS =
            Collections.unmodifiableList(Arrays.asList("site-admin", "admin"));

    private static final String REQUIRED_PERMISSIONS_LABEL = StringUtils.join(REQUIRED_PERMISSIONS, ", ");

    @Activate
    public void activate() {
        // Priority 21.5: immediately after core's own permission check (TemplatePermissionCheckFilter, 21) and
        // clear of the 22.x template band. AbstractFilter breaks a priority tie on the class name, so an exact
        // 22 would order this against core's templateNodeFilter (22.0) by an accident of package naming rather
        // than by intent; 21.5 states the intended slot instead of relying on that.
        // This runs inside the fragment cache's generation scope (live only, 16 / 16.5), which is safe because
        // that cache keys on the caller's ACL signature: an entry generated for an administrator is not served
        // to a caller who lacks the grant.
        setPriority(21.5f);
        setApplyOnNodeTypes(APPLY_ON_NODE_TYPES);
        setDescription("Renders a settings component only for a caller holding an administration permission "
                + "on the main resource");
        logger.debug("SettingsComponentPermissionFilter active on {}", APPLY_ON_NODE_TYPES);
    }

    @Override
    public String prepare(RenderContext renderContext, Resource resource, RenderChain chain) throws Exception {
        Resource mainResource = renderContext.getMainResource();
        JCRNodeWrapper contextNode = mainResource != null ? mainResource.getNode() : null;
        if (contextNode == null) {
            // Fail closed: with no main resource there is nothing to evaluate the permission against, and this
            // is an administration capability.
            logger.warn("No main resource to evaluate {} against; not rendering it", resource.getNodePath());
            return StringUtils.EMPTY;
        }

        for (String permission : REQUIRED_PERMISSIONS) {
            if (contextNode.hasPermission(permission)) {
                return null;
            }
        }

        if (logger.isWarnEnabled()) {
            logger.warn("Not rendering {}: {} holds none of {} on {}", resource.getNodePath(),
                    renderContext.getUser() != null ? renderContext.getUser().getName() : "the current user",
                    REQUIRED_PERMISSIONS_LABEL, contextNode.getPath());
        }
        return StringUtils.EMPTY;
    }
}
