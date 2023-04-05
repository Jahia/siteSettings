import {registry} from '@jahia/ui-extender';
import {Group} from '@jahia/moonstone';
import React from 'react';

export const registerRoutes = function () {
    registry.add('adminRoute', 'manageGroups', {
        targets: ['administration-server-usersAndRoles:20'],
        requiredPermission: 'adminGroups',
        icon: null,
        label: 'siteSettings:groups.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/adminframe/default/$lang/settings.manageGroups.html'
    });

    registry.add('adminRoute', 'settings/groups', {
        targets: ['administration-sites:20'],
        requiredPermission: 'siteAdminGroups',
        icon: <Group/>,
        label: 'siteSettings:groups.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/editframe/default/$lang/sites/$site-key.manageGroups.html'
    });
};
