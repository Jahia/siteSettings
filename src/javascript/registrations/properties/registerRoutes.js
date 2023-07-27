import React from 'react';
import {registry} from '@jahia/ui-extender';
import {Setting} from '@jahia/moonstone';
import SiteProperties from './SiteProperties';

export const registerRoutes = function () {
    registry.add('adminRoute', 'settings/properties', {
        targets: ['administration-sites:0'],
        requiredPermission: 'siteAdminSiteProperties',
        icon: <Setting/>,
        label: 'siteSettings:properties.label',
        isSelectable: true,
        render: () => <SiteProperties/>
    });
};
