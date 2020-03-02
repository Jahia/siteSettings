import {registry} from '@jahia/ui-extender';

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
        icon: null,
        label: 'siteSettings:users.label',
        childrenTarget: 'usersandroles',
        isSelectable: true,
        level: level
    });
};
