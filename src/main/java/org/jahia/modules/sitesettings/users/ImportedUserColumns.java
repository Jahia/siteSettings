package org.jahia.modules.sitesettings.users;

import org.jahia.services.content.decorator.JCRUserNode;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * The columns a CSV bulk user import writes on the users it creates.
 * <p>
 * A header in one of the namespaces the product reserves carries product meaning, so the import writes it
 * only when it names one of the profile properties {@code jnt:user} declares whose value a CSV cell can
 * state. A header in any other
 * namespace carries profile data of the deployment's own making, and the import writes it as it stands.
 * <p>
 * The set is written out here rather than derived from the node type, because "declared by {@code jnt:user}"
 * is not the predicate this class needs. The type declares 20 names, and seven of them stay out.
 * {@code j:password}, {@code j:external}, {@code j:externalSource}, {@code j:accountLocked},
 * {@code j:invalidateSessionTime} and {@code j:publicProperties} carry account or session state rather than
 * profile data, and core draws the same line for its own generic write actions in
 * {@code SettingsBean.DEFAULT_RENDER_ACTION_RESTRICTED_PROPERTIES}, which names all six.
 * {@code j:picture} stays out for a different reason: it is a weakreference to a file, which a CSV cell
 * carries no sensible way to state.
 * <p>
 * The thirteen that stay in are not all plain text, and a cell has to state a value each one accepts.
 * {@code j:birthDate} is a date, {@code j:gender} and {@code j:title} each carry a choice list, and
 * {@code j:email} carries a pattern. The repository is what rejects a value none of them accepts, and this
 * class does not screen for it.
 * <p>
 * One note for a reader checking this against the node type.
 * {@code ExtendedNodeType.getDeclaredPropertyDefinitionsAsMap()} does answer which names the type declares,
 * without the residual, so the node type is readable here. It is the wrong question, not an unanswerable
 * one. Read it from a running repository rather than from a checkout of core: the count above is what
 * {@code jnt:user} declares on 8.2.4.0-SNAPSHOT, and a checkout can be behind it.
 */
final class ImportedUserColumns {

    /** The columns the file must state, which the import reads as the user name and the password. */
    private static final Set<String> MANDATORY = Collections.unmodifiableSet(
            new HashSet<>(Arrays.asList("j:nodename", JCRUserNode.J_PASSWORD)));

    /** The namespaces the product reserves for the properties it gives a meaning of its own. */
    private static final String[] RESERVED_NAMESPACES = {"j:", "jcr:"};

    /** The profile properties of {@code jnt:user} the import writes from a column in a reserved namespace. */
    private static final Set<String> IMPORTED_RESERVED = Collections.unmodifiableSet(
            new HashSet<>(Arrays.asList(
                    "j:firstName", "j:lastName", "j:email", "j:organization", "j:function", "j:title",
                    "j:gender", "j:birthDate", "j:about", "j:skypeID", "j:twitterID", "j:facebookID",
                    "j:linkedinID")));

    private ImportedUserColumns() {
    }

    /**
     * States whether the import writes the column under this header.
     */
    static boolean isImported(String header) {
        if (header == null) {
            return false;
        }
        String name = header.trim();
        if (name.isEmpty()) {
            return false;
        }
        for (String namespace : RESERVED_NAMESPACES) {
            if (name.startsWith(namespace)) {
                return IMPORTED_RESERVED.contains(name);
            }
        }
        return true;
    }

    /**
     * The headers of the columns the import leaves out, in the order the file states them, so the caller can
     * report them all at once. The mandatory columns are read as the user name and the password rather than
     * written as properties, so they are not reported. A column with no header has no name to report.
     */
    static List<String> leftOut(List<String> headers) {
        List<String> result = new ArrayList<>();
        for (String header : headers) {
            String name = header != null ? header.trim() : "";
            if (!isImported(header) && !MANDATORY.contains(name) && !name.isEmpty()) {
                result.add(name);
            }
        }
        return result;
    }
}
