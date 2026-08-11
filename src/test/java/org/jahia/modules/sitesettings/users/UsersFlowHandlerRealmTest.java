package org.jahia.modules.sitesettings.users;

import org.jahia.modules.sitesettings.users.management.UserProperties;
import org.jahia.services.content.JCRNodeWrapper;
import org.jahia.services.content.decorator.JCRSiteNode;
import org.junit.Test;
import org.springframework.binding.message.MessageContext;
import org.springframework.binding.message.MessageResolver;

import javax.jcr.RepositoryException;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Realm resolution in {@link UsersFlowHandler} and the scope check it gates.
 * <p>
 * The screen manages the principals of the realm its container carries: a {@code jnt:virtualsite} scopes it
 * to that site's store, a {@code jnt:globalSettings} to the server-global one. A container of any other type
 * carries no realm, and the scope check then answers false whatever it is asked about.
 * <p>
 * Each realm is asserted in both directions, what it accepts AND what it declines, so a check wired to answer
 * false unconditionally could not satisfy this class. The last case takes a public entry point rather than the
 * check alone, which is what shows the resolved state reaching a caller.
 */
public class UsersFlowHandlerRealmTest {

    private static final String SITE = "alpha";
    private static final String OTHER_SITE = "beta";

    private static UsersFlowHandler boundTo(JCRNodeWrapper container) throws RepositoryException {
        UsersFlowHandler handler = new UsersFlowHandler();
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
        UsersFlowHandler handler = boundTo(siteContainer(SITE));

        assertTrue(handler.isInAdministeredScope("/sites/" + SITE + "/users/jdoe"));
        assertFalse(handler.isInAdministeredScope("/sites/" + OTHER_SITE + "/users/jdoe"));
        assertFalse(handler.isInAdministeredScope("/users/jdoe"));
        assertFalse(handler.isInAdministeredScope(null));

        // A site whose key merely starts with the administered one is a different site.
        assertFalse(handler.isInAdministeredScope("/sites/" + SITE + "evil/users/jdoe"));
    }

    @Test
    public void serverWideRealmScopesToTheGlobalStore() throws RepositoryException {
        UsersFlowHandler handler = boundTo(containerOfType("jnt:globalSettings"));

        assertTrue(handler.isInAdministeredScope("/users/jdoe"));
        assertTrue(handler.isInAdministeredScope("/groups/staff"));
        assertFalse(handler.isInAdministeredScope("/sites/" + SITE + "/users/jdoe"));
        assertFalse(handler.isInAdministeredScope(null));
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
        assertScopesToNothing(new UsersFlowHandler());
    }

    @Test
    public void creationDeclinesWhereNoRealmIsResolved() throws RepositoryException {
        UsersFlowHandler handler = boundTo(containerOfType("jnt:contentFolder"));
        MessageContext context = mock(MessageContext.class);

        assertFalse("creation must report failure where no realm is resolved",
                handler.addUser(new UserProperties(), context));
        verify(context).addMessage(any(MessageResolver.class));
    }

    private static void assertScopesToNothing(UsersFlowHandler handler) {
        assertFalse(handler.isInAdministeredScope("/users/jdoe"));
        assertFalse(handler.isInAdministeredScope("/groups/staff"));
        assertFalse(handler.isInAdministeredScope("/sites/" + SITE + "/users/jdoe"));
    }
}
