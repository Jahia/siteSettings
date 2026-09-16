package org.jahia.modules.sitesettings.users;

import org.junit.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

/**
 * The columns a CSV bulk user import writes, in {@link ImportedUserColumns}.
 * <p>
 * A column whose header carries one of the namespaces the product reserves is written when it names a profile
 * property of {@code jnt:user}; a column in any other namespace carries profile data of the deployment's own
 * making and is written as it stands. Both directions are asserted for each namespace, so a check wired to
 * answer the same thing for everything could not satisfy this class.
 */
public class ImportedUserColumnsTest {

    @Test
    public void profilePropertiesOfTheReservedNamespaceAreWritten() {
        assertWritten("j:firstName");
        assertWritten("j:lastName");
        assertWritten("j:email");
        assertWritten("j:organization");
        assertWritten("j:function");
        assertWritten("j:title");
        assertWritten("j:gender");
        assertWritten("j:birthDate");
        assertWritten("j:about");
        assertWritten("j:skypeID");
        assertWritten("j:twitterID");
        assertWritten("j:facebookID");
        assertWritten("j:linkedinID");
    }

    @Test
    public void otherPropertiesOfTheReservedNamespaceAreLeftOut() {
        // the account state and the provider the repository resolves the user through
        assertLeftOut("j:accountLocked");
        assertLeftOut("j:external");
        assertLeftOut("j:externalSource");
        // what the public half of a profile is named after
        assertLeftOut("j:publicProperties");
        // the two columns the import reads rather than writes
        assertLeftOut("j:nodename");
        assertLeftOut("j:password");
        // a name the reserved namespace does not declare at all
        assertLeftOut("j:madeUpProperty");
    }

    @Test
    public void theRepositoryNamespaceIsLeftOutWhole() {
        assertLeftOut("jcr:title");
        assertLeftOut("jcr:createdBy");
        assertLeftOut("jcr:mixinTypes");
    }

    @Test
    public void columnsOutsideTheReservedNamespacesAreWritten() {
        // the two the single-user screen writes, which carry no namespace
        assertWritten("preferredLanguage");
        assertWritten("emailNotificationsDisabled");
        // a property of the deployment's own making, which jnt:user accepts as residual
        assertWritten("employeeId");
        assertWritten("acme:department");
        // a namespace whose name merely starts like a reserved one
        assertWritten("jx:custom");
        assertWritten("jcrx:custom");
    }

    @Test
    public void aHeaderIsReadAsTheWholeNameItStates() {
        // a longer name that starts with a written one is a different property
        assertLeftOut("j:firstNameOfRecord");
        assertLeftOut("j:emailAlias");
        // surrounding space belongs to the file's layout, not to the name
        assertWritten("  j:firstName  ");
        assertLeftOut("  j:password  ");
    }

    @Test
    public void aColumnWithNoHeaderIsLeftOut() {
        assertLeftOut("");
        assertLeftOut("   ");
        assertLeftOut(null);
    }

    @Test
    public void theReportNamesEveryColumnLeftOutInTheOrderTheFileStatesThem() {
        List<String> headers = Arrays.asList(
                "j:nodename", "j:password", "j:accountLocked", "j:firstName", "jcr:createdBy", "employeeId",
                "j:external");

        assertEquals(Arrays.asList("j:accountLocked", "jcr:createdBy", "j:external"),
                ImportedUserColumns.leftOut(headers));
    }

    @Test
    public void theReportNamesNothingWhenEveryColumnIsWritten() {
        List<String> headers = Arrays.asList("j:nodename", "j:password", "j:firstName", "employeeId");

        assertEquals(Collections.<String>emptyList(), ImportedUserColumns.leftOut(headers));
    }

    @Test
    public void theReportNamesTheColumnsWithoutTheSpaceTheFileStatesAroundThem() {
        assertEquals(Collections.singletonList("j:external"),
                ImportedUserColumns.leftOut(Arrays.asList(" j:nodename ", " j:password ", " j:external ")));
    }

    @Test
    public void theReportHasNoNameToGiveForAColumnWithNoHeader() {
        assertEquals(Collections.<String>emptyList(),
                ImportedUserColumns.leftOut(Arrays.asList("j:nodename", "j:password", "", "   ")));
    }

    private static void assertWritten(String header) {
        assertTrue("the import must write the column '" + header + "'", ImportedUserColumns.isImported(header));
    }

    private static void assertLeftOut(String header) {
        assertFalse("the import must leave out the column '" + header + "'", ImportedUserColumns.isImported(header));
    }
}
