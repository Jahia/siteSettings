package org.jahia.modules.sitesettings.groups;

import org.jahia.services.content.JCRNodeWrapper;
import org.jahia.services.content.decorator.JCRSiteNode;
import org.junit.Test;

import javax.jcr.RepositoryException;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Realm resolution in {@link ManageGroupsFlowHandler} and the scope checks it gates.
 * <p>
 * The screen manages the principals of the realm its container carries: a {@code jnt:virtualsite} scopes it
 * to that site's store, a {@code jnt:globalSettings} to the server-global one. A container of any other type
 * carries no realm, and every scope check then answers false whatever it is asked about — including for the
 * server-global principal that both resolved realms do accept as a member.
 * <p>
 * Each realm is asserted in both directions, what it accepts AND what it declines: a check wired to answer
 * false unconditionally would satisfy every decline on its own, so the accepts are what give the declines
 * their meaning.
 */
public class ManageGroupsFlowHandlerRealmTest {

    private static final String SITE = "alpha";
    private static final String OTHER_SITE = "beta";

    private static ManageGroupsFlowHandler boundTo(JCRNodeWrapper container) throws RepositoryException {
        ManageGroupsFlowHandler handler = new ManageGroupsFlowHandler();
        handler.resolveRealm(container);
        return handler;
    }

    private static JCRNodeWrapper siteContainer(String siteKey) throws RepositoryException {
        JCRSiteNode container = mock(JCRSiteNode.class);
        when(container.isNodeType("jnt:virtualsite")).thenReturn(true);
        when(container.getSiteKey()).thenReturn(siteKey);
        return container;
    }

    private static JCRNodeWrapper containerOfType(String nodeType) throws RepositoryException {
        JCRNodeWrapper container = mock(JCRNodeWrapper.class);
        when(container.isNodeType(nodeType)).thenReturn(true);
        return container;
    }

    @Test
    public void siteRealmScopesToThatSiteAlone() throws RepositoryException {
        ManageGroupsFlowHandler handler = boundTo(siteContainer(SITE));

        assertTrue(handler.isInAdministeredScope("/sites/" + SITE + "/groups/staff"));
        assertFalse(handler.isInAdministeredScope("/sites/" + OTHER_SITE + "/groups/staff"));
        assertFalse(handler.isInAdministeredScope("/groups/staff"));
        assertFalse(handler.isInAdministeredScope(null));

        // A site whose key merely starts with the administered one is a different site.
        assertFalse(handler.isInAdministeredScope("/sites/" + SITE + "evil/groups/staff"));

        // Membership is the looser rule: a site group may hold a server-global principal, never another
        // site's own.
        assertTrue(handler.isAllowedMember("/users/jdoe"));
        assertTrue(handler.isAllowedMember("/sites/" + SITE + "/users/jdoe"));
        assertFalse(handler.isAllowedMember("/sites/" + OTHER_SITE + "/users/jdoe"));
        assertFalse(handler.isAllowedMember("/sites/" + SITE + "evil/users/jdoe"));
        assertFalse(handler.isAllowedMember(null));

        assertTrue(handler.isSiteKeyInScope(SITE));
        assertFalse(handler.isSiteKeyInScope(OTHER_SITE));
        assertFalse(handler.isSiteKeyInScope(null));
    }

    @Test
    public void serverWideRealmScopesToTheGlobalStore() throws RepositoryException {
        ManageGroupsFlowHandler handler = boundTo(containerOfType("jnt:globalSettings"));

        assertTrue(handler.isInAdministeredScope("/groups/administrators"));
        assertTrue(handler.isInAdministeredScope("/users/jdoe"));
        assertFalse(handler.isInAdministeredScope("/sites/" + SITE + "/groups/staff"));
        assertFalse(handler.isInAdministeredScope(null));

        assertTrue(handler.isAllowedMember("/users/jdoe"));
        assertFalse(handler.isAllowedMember("/sites/" + SITE + "/users/jdoe"));

        // The server-wide realm owns the global store, so it may target it and any site.
        assertTrue(handler.isSiteKeyInScope(null));
        assertTrue(handler.isSiteKeyInScope(SITE));
    }

    @Test
    public void containerCarryingNoRealmScopesToNothing() throws RepositoryException {
        assertScopesToNothing(boundTo(containerOfType("jnt:contentFolder")));
    }

    @Test
    public void absentContainerNodeScopesToNothing() throws RepositoryException {
        assertScopesToNothing(boundTo(null));
    }

    @Test
    public void handlerReachedWithNoContainerAtAllScopesToNothing() {
        assertScopesToNothing(new ManageGroupsFlowHandler());
    }

    private static void assertScopesToNothing(ManageGroupsFlowHandler handler) {
        assertFalse(handler.isInAdministeredScope("/groups/administrators"));
        assertFalse(handler.isInAdministeredScope("/users/jdoe"));
        assertFalse(handler.isInAdministeredScope("/sites/" + SITE + "/groups/staff"));

        // Down to the server-global principal both resolved realms accept as a member.
        assertFalse(handler.isAllowedMember("/users/jdoe"));
        assertFalse(handler.isAllowedMember("/sites/" + SITE + "/users/jdoe"));

        // Including the null destination the server-wide realm would otherwise accept.
        assertFalse(handler.isSiteKeyInScope(null));
        assertFalse(handler.isSiteKeyInScope(SITE));
    }
}
