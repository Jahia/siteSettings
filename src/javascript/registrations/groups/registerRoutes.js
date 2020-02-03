import {registry} from '@jahia/ui-extender';

export const registerRoutes = function (t) {
    const level = 'server';
    const parentTarget = 'administration-server';

    const path = '/administration/manageGroups';
    const route = 'manageGroups';
    registry.addOrReplace('adminRoute', `${level}-${path.toLowerCase()}`, {
        id: route,
        targets: [`${parentTarget}-usersandroles:1`],
        path: path,
        route: route,
        defaultPath: path,
        icon: null,
        label: t('groups.label'),
        childrenTarget: 'usersandroles',
        isSelectable: true,
        level: level
    });
};
