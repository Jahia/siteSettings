package org.jahia.modules.sitesettings.render;

import org.apache.commons.lang.StringUtils;
import org.jahia.services.content.JCRNodeWrapper;
import org.jahia.services.content.nodetypes.ExtendedNodeType;
import org.jahia.services.render.RenderContext;
import org.jahia.services.render.Resource;
import org.jahia.services.render.filter.AbstractFilter;
import org.jahia.services.render.filter.RenderChain;
import org.jahia.services.render.filter.RenderFilter;
import org.osgi.framework.BundleContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.atomic.AtomicLong;
import java.util.regex.Pattern;

/**
 * Renders a component this module defines only from inside a module.
 * <p>
 * The marker alone is too broad to key on: other modules wear it on ordinary components that live in site
 * content, from login forms to image references. Hence the second condition, the defining module, which also
 * needs no list to keep in step with the CND.
 * <p>
 * Placement is the whole condition, and no permission is evaluated here. That is deliberate: the access rule
 * of a settings screen is expressed per screen and at several granularities, so asserting a coarser one here
 * would refuse a role that holds the finer one.
 */
@Component(service = RenderFilter.class, immediate = true)
public class SettingsComponentScopeFilter extends AbstractFilter {

    private static final Logger logger = LoggerFactory.getLogger(SettingsComponentScopeFilter.class);

    /** The markers that keep a component out of the content-creation pickers. */
    private static final String APPLY_ON_NODE_TYPES = "jmix:studioOnly,jmix:hiddenType";

    /** Inside a module: usually its templates, but a module may seed content elsewhere under its root. */
    private static final Pattern MODULE_PATH = Pattern.compile("^/modules/[^/]+/[^/]+/.+");

    private static final String STUDIO_MODE = "studiomode";

    /**
     * One refusal reaches WARN per interval, for the whole filter rather than per path. A live render is
     * cached so the first one absorbs the rest, but a preview or edit render is not, and nothing else
     * deduplicates. DEBUG still carries every occurrence.
     * <p>
     * Core's {@code LimiterExecutor} does this, and this module cannot use it: the class arrived after the
     * platform version this module's parent pins, so importing it would raise the minimum platform for a
     * logging concern. One timestamp is cheaper than that, and it keeps the throttle per filter rather than
     * per path — a path comes from content, so a per-path key would grow without bound.
     */
    private static final long REFUSAL_LOG_INTERVAL_MS = 5L * 60 * 1000;
    private static final AtomicLong lastRefusalLoggedAt = new AtomicLong(0);

    private String moduleId;

    @Activate
    public void activate(BundleContext context) {
        moduleId = context.getBundle().getSymbolicName();

        // 21.6: after core's template permission check (21) and its placement filter (21.5), so the order is
        // stated rather than left to AbstractFilter's tie-break on class name.
        setPriority(21.6f);
        setApplyOnNodeTypes(APPLY_ON_NODE_TYPES);
        setDescription("Renders a component defined by this module only from inside a module");
    }

    @Override
    public String prepare(RenderContext renderContext, Resource resource, RenderChain chain) throws Exception {
        JCRNodeWrapper node = resource.getNode();
        if (node == null) {
            return null;
        }

        ExtendedNodeType type = node.getPrimaryNodeType();
        if (type == null || !moduleId.equals(type.getSystemId())) {
            return null;
        }

        String path = node.getPath();
        if (isInAModule(path) || STUDIO_MODE.equals(renderContext.getEditModeConfigName())) {
            return null;
        }

        String nodeType = type.getName();
        if (shouldLogRefusal()) {
            logger.warn("Not rendering {}: {} is defined by {} and belongs inside a module. Enable DEBUG on {}"
                    + " for every occurrence. (silent for {}min)", path, nodeType, moduleId,
                    SettingsComponentScopeFilter.class.getName(), REFUSAL_LOG_INTERVAL_MS / 60000);
        }
        logger.debug("Not rendering {}: {} is defined by {} and belongs inside a module", path, nodeType, moduleId);
        return StringUtils.EMPTY;
    }

    /** True at most once per interval. Compare-and-set so concurrent renders cannot both pass. */
    private static boolean shouldLogRefusal() {
        long now = System.currentTimeMillis();
        long previous = lastRefusalLoggedAt.get();
        return now - previous > REFUSAL_LOG_INTERVAL_MS && lastRefusalLoggedAt.compareAndSet(previous, now);
    }

    static boolean isInAModule(String path) {
        return path != null && MODULE_PATH.matcher(path).matches();
    }
}
