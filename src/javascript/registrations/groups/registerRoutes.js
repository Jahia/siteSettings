import {registry} from '@jahia/ui-extender';

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
        icon: null,
        label: 'siteSettings:groups.label',
        childrenTarget: 'usersandroles',
        isSelectable: true,
        level: level
    });
};
