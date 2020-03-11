import {registry} from '@jahia/ui-extender';
import {Person} from '@jahia/moonstone/dist/icons';
import React from 'react';

export const registerRoutes = function () {
    const level = 'server';
    const parentTarget = 'administration-server';

    const path = '/administration/manageUsers';
    const route = 'manageUsers';
    registry.add('adminRoute', `${level}-${path.toLowerCase()}`, {
        id: route,
        targets: [`${parentTarget}-usersandroles:4`],
        path: path,
        route: route,
        defaultPath: path,
        requiredPermission: 'adminUsers',
        icon: <Person/>,
        label: 'siteSettings:users.label',
        childrenTarget: null,
        isSelectable: true,
        level: level
    });

    registry.add('adminRoute', 'sites-/administration/:sitekey/settings/users', {
        id: 'users',
        targets: ['administration-sites:4'],
        path: '/administration/:siteKey/settings/users',
        route: 'manageUsers',
        defaultPath: '/administration/:siteKey/settings/users',
        requiredPermission: 'siteAdminUsers',
        icon: <Person/>,
        label: 'siteSettings:users.label',
        childrenTarget: null,
        isSelectable: true,
        level: 'sites'
    });
};
