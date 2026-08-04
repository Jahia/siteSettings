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
 * Registered via OSGi Declarative Services, matching the development line. NOTE: this requires the
 * {@code <_dsannotations>*</_dsannotations>} bnd instruction added to this module's pom — without it an
 * {@code @Component} class compiles and ships but emits no {@code OSGI-INF} descriptor, so the component
 * never registers and this filter silently does not run. Confirm the descriptor is present in the built jar
 * rather than assuming it.
 */
@Component(service = RenderFilter.class, immediate = true)
public class SettingsComponentPermissionFilter extends AbstractFilter {

    private static final Logger logger = LoggerFactory.getLogger(SettingsComponentPermissionFilter.class);

    /** Node types gated by this filter — every settings screen this module ships on this line. */
    private static final String APPLY_ON_NODE_TYPES =
            "jnt:siteSettingsManageUsers," +
            "jnt:siteSettingsManageGroups," +
            "jnt:siteSettingsManageModules," +
            "jnt:siteSettingsManagePageModels," +
            "jnt:siteSettingsWcagCompliance," +
            "jnt:siteSettingsHtmlFiltering," +
            "jnt:siteSettingsManageLanguages";

    /** Any one of these on the main resource is sufficient. */
    private static final List<String> REQUIRED_PERMISSIONS =
            Collections.unmodifiableList(Arrays.asList("site-admin", "admin"));

    private static final String REQUIRED_PERMISSIONS_LABEL = StringUtils.join(REQUIRED_PERMISSIONS, ", ");

    @Activate
    public void activate() {
        // Priority 22: immediately after core's own permission check (TemplatePermissionCheckFilter, 21) and
        // before the fragment is produced or cached, so a refusal cannot populate a cache entry that a
        // differently-privileged caller could later be served.
        setPriority(22);
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
            // Fail closed: with no main resource there is nothing to evaluate the permission against.
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
