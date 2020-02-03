import {registry} from '@jahia/ui-extender';

export const registerRoutes = function (t) {
    const level = 'server';
    const parentTarget = 'administration-server';

    const path = '/administration/manageUsers';
    const route = 'manageUsers';
    registry.addOrReplace('adminRoute', `${level}-${path.toLowerCase()}`, {
        id: route,
        targets: [`${parentTarget}-usersandroles:4`],
        path: path,
        route: route,
        defaultPath: path,
        icon: null,
        label: t('users.label'),
        childrenTarget: 'usersandroles',
        isSelectable: true,
        level: level
    });
};
