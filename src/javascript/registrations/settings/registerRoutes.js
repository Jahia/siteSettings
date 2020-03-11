import React from 'react';
import {registry} from '@jahia/ui-extender';
import {Language} from '@jahia/moonstone/dist/icons';
import {Filter} from '@jahia/moonstone/dist/icons';

export const registerRoutes = function () {
    const level = 'sites';
    const parentTarget = 'administration-sites';

    const path = '/administration/:siteKey/settings';
    registry.add('adminRoute', `${level}-${path.toLowerCase()}/filtering`, {
        id: 'filtering',
        targets: [`${parentTarget}:1`],
        path: `${path}/filtering`,
        route: 'htmlFiltering',
        defaultPath: `${path}/filtering`,
        requiredPermission: 'siteAdminHtmlSettings',
        icon: <Filter/>,
        label: 'siteSettings:filtering.label',
        isSelectable: true,
        level: level
    });

    registry.add('adminRoute', `${level}-${path.toLowerCase()}/languages`, {
        id: 'languages',
        targets: [`${parentTarget}:2`],
        path: `${path}/languages`,
        route: 'manageLanguages',
        defaultPath: `${path}/languages`,
        requiredPermission: 'siteAdminLanguages',
        icon: <Language/>,
        label: 'siteSettings:languages.label',
        isSelectable: true,
        level: level
    });

    registry.add('adminRoute', `${level}-${path.toLowerCase()}/wcag`, {
        id: 'wcag',
        targets: [`${parentTarget}:5`],
        path: `${path}/wcag`,
        route: 'wcagCompliance',
        defaultPath: `${path}/wcag`,
        requiredPermission: 'siteAdminWcagCompliance',
        icon:  null,
        label: 'siteSettings:wcag.label',
        isSelectable: true,
        level: level
    });

    registry.add('adminRoute', `${level}-${path.toLowerCase()}/models`, {
        id: 'models',
        targets: [`${parentTarget}:6`],
        path: `${path}/models`,
        route: 'page-models',
        defaultPath: `${path}/models`,
        requiredPermission: 'siteAdminTemplates',
        icon:  null,
        label: 'siteSettings:models.label',
        isSelectable: true,
        level: level
    });

    registry.add('adminRoute', `${level}-${path.toLowerCase()}/roles`, {
        id: 'roles',
        targets: [`${parentTarget}:7`],
        path: `${path}/roles`,
        route: 'manageSiteRoles',
        defaultPath: `${path}/roles`,
        requiredPermission: 'siteAdminSiteRoles',
        icon:  null,
        label: 'siteSettings:roles.label',
        isSelectable: true,
        level: level
    });

    registry.add('adminRoute', `${level}-${path.toLowerCase()}/modules`, {
        id: 'modules',
        targets: [`${parentTarget}:8`],
        path: `${path}/modules`,
        route: 'manageModules',
        defaultPath: `${path}/modules`,
        requiredPermission: 'siteAdminTemplates',
        icon:  null,
        label: 'siteSettings:modules.label',
        isSelectable: true,
        level: level
    });
};
