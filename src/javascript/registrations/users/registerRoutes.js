import {registry} from '@jahia/ui-extender';
import {Person} from '@jahia/moonstone/dist/icons';
import React from 'react';

export const registerRoutes = function () {
    registry.add('adminRoute', 'manageUsers', {
        targets: ['administration-server-usersAndRoles:10'],
        requiredPermission: 'adminUsers',
        icon: null,
        label: 'siteSettings:users.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/adminframe/default/$lang/settings.manageUsers.html'
    });

    registry.add('adminRoute', 'settings/users', {
        targets: ['administration-sites:10'],
        requiredPermission: 'siteAdminUsers',
        icon: <Person/>,
        label: 'siteSettings:users.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/editframe/default/$lang/sites/$site-key.manageUsers.html'
    });
};
