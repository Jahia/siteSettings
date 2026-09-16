package org.jahia.modules.sitesettings.users;

import org.jahia.services.content.decorator.JCRUserNode;
import org.junit.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Properties;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

/**
 * What one line of a CSV bulk user import writes, in {@link UsersFlowHandler}.
 * <p>
 * The header states the columns and each line states the values, and the two are read against each other by
 * position. A line is free to state fewer values than the header has columns, and the columns it does not
 * reach write nothing.
 */
public class UsersFlowHandlerLinesTest {

    private static final List<String> HEADER =
            Arrays.asList("j:nodename", "j:password", "j:firstName", "employeeId");

    @Test
    public void aLineStatingEveryValueWritesEveryImportedColumn() {
        Properties result = UsersFlowHandler.buildProperties(HEADER, Arrays.asList("jdoe", "secret", "Jane", "E-1"));

        assertEquals("Jane", result.getProperty("j:firstName"));
        assertEquals("E-1", result.getProperty("employeeId"));
        // the two the import reads as the user name and the password, rather than writing as properties
        assertNull(result.getProperty("j:nodename"));
        assertNull(result.getProperty("j:password"));
    }

    @Test
    public void aLineStatingFewerValuesWritesTheColumnsItReaches() {
        Properties result = UsersFlowHandler.buildProperties(HEADER, Arrays.asList("jdoe", "secret", "Jane"));

        assertEquals("Jane", result.getProperty("j:firstName"));
        // the line never reaches this column, so it carries no value rather than an empty one
        assertNull(result.getProperty("employeeId"));
    }

    @Test
    public void aLineStatingOnlyTheMandatoryValuesWritesNothing() {
        assertTrue(UsersFlowHandler.buildProperties(HEADER, Arrays.asList("jdoe", "secret")).isEmpty());
    }

    @Test
    public void anEmptyLineWritesNothing() {
        assertTrue(UsersFlowHandler.buildProperties(HEADER, Collections.<String>emptyList()).isEmpty());
    }

    @Test
    public void aLineStatingMoreValuesThanTheHeaderHasColumnsWritesTheColumns() {
        Properties result =
                UsersFlowHandler.buildProperties(HEADER, Arrays.asList("jdoe", "secret", "Jane", "E-1", "spare"));

        assertEquals("Jane", result.getProperty("j:firstName"));
        assertEquals("E-1", result.getProperty("employeeId"));
        assertEquals(2, result.size());
    }

    @Test
    public void aLineReachingBothMandatoryColumnsCanBeRead() {
        assertTrue(statesMandatory(Arrays.asList("jdoe", "secret")));
        assertTrue(statesMandatory(Arrays.asList("jdoe", "secret", "Jane")));
    }

    @Test
    public void aLineStoppingShortOfEitherMandatoryColumnCannotBeRead() {
        assertFalse(statesMandatory(Collections.singletonList("jdoe")));
        assertFalse(statesMandatory(Collections.<String>emptyList()));
    }

    @Test
    public void theMandatoryColumnsAreReadWhereverTheHeaderStatesThem() {
        // a header that states the password first, so the password column decides the length a line needs
        List<String> header = Arrays.asList("j:firstName", "j:nodename", "j:password");
        int userNamePos = header.indexOf("j:nodename");
        int passwordPos = header.indexOf(JCRUserNode.J_PASSWORD);

        assertTrue(UsersFlowHandler.statesMandatoryValues(
                Arrays.asList("Jane", "jdoe", "secret"), userNamePos, passwordPos));
        assertFalse(UsersFlowHandler.statesMandatoryValues(
                Arrays.asList("Jane", "jdoe"), userNamePos, passwordPos));
    }

    @Test
    public void aBlankLineStatesNoValue() {
        assertTrue(UsersFlowHandler.statesNoValue(Collections.singletonList("")));
        assertTrue(UsersFlowHandler.statesNoValue(Arrays.asList("", "   ", "")));
        assertTrue(UsersFlowHandler.statesNoValue(Collections.<String>emptyList()));
    }

    @Test
    public void aLineCarryingAnyValueStatesOne() {
        assertFalse(UsersFlowHandler.statesNoValue(Arrays.asList("jdoe", "")));
        assertFalse(UsersFlowHandler.statesNoValue(Arrays.asList("", "secret")));
    }

    @Test
    public void theHeaderIsReadWithoutTheSpaceTheFileLaysOutAroundIt() {
        List<String> header = UsersFlowHandler.trimmed(new String[]{" j:nodename ", "  j:password", "j:firstName "});

        assertEquals(Arrays.asList("j:nodename", "j:password", "j:firstName"), header);
        // which is what lets the import locate the mandatory columns in such a file
        assertEquals(0, header.indexOf("j:nodename"));
        assertEquals(1, header.indexOf(JCRUserNode.J_PASSWORD));
    }

    @Test
    public void aColumnWithNoHeaderReadsAsAnEmptyName() {
        assertEquals(Arrays.asList("j:nodename", ""), UsersFlowHandler.trimmed(new String[]{"j:nodename", "   "}));
    }

    private static boolean statesMandatory(List<String> line) {
        return UsersFlowHandler.statesMandatoryValues(
                line, HEADER.indexOf("j:nodename"), HEADER.indexOf(JCRUserNode.J_PASSWORD));
    }
}
