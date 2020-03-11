import {registry} from '@jahia/ui-extender';
import {Group} from '@jahia/moonstone/dist/icons';
import React from 'react';

export const registerRoutes = function () {
    const level = 'server';
    const parentTarget = 'administration-server';

    const path = '/administration/manageGroups';
    const route = 'manageGroups';
    registry.add('adminRoute', `${level}-${path.toLowerCase()}`, {
        id: route,
        targets: [`${parentTarget}-usersandroles:1`],
        path: path,
        route: route,
        defaultPath: path,
        requiredPermission: 'adminGroups',
        icon: <Group/>,
        label: 'siteSettings:groups.label',
        childrenTarget: null,
        isSelectable: true,
        level: level
    });

    registry.add('adminRoute', 'sites-/administration/:sitekey/settings/groups', {
        id: 'groups',
        targets: ['administration-sites:3'],
        path: '/administration/:siteKey/settings/groups',
        route: 'manageGroups',
        defaultPath: '/administration/:siteKey/settings/groups',
        requiredPermission: 'siteAdminGroups',
        icon: <Group/>,
        label: 'siteSettings:groups.label',
        childrenTarget: null,
        isSelectable: true,
        level: 'sites'
    });
};
