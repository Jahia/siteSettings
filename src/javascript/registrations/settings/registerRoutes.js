import React from 'react';
import {registry} from '@jahia/ui-extender';
import {Filter, Language} from '@jahia/moonstone/dist/icons';

export const registerRoutes = function () {
    registry.add('adminRoute', 'settings/filtering', {
        targets: ['administration-sites:1'],
        requiredPermission: 'siteAdminHtmlSettings',
        icon: <Filter/>,
        label: 'siteSettings:filtering.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/editframe/default/$lang/sites/$site-key.htmlFiltering.html'
    });

    registry.add('adminRoute', 'settings/languages', {
        targets: ['administration-sites:2'],
        requiredPermission: 'siteAdminLanguages',
        icon: <Language/>,
        label: 'siteSettings:languages.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/editframe/default/$lang/sites/$site-key.manageLanguages.html'
    });

    registry.add('adminRoute', 'settings/wcag', {
        targets: ['administration-sites:5'],
        requiredPermission: 'siteAdminWcagCompliance',
        icon: null,
        label: 'siteSettings:wcag.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/editframe/default/$lang/sites/$site-key.wcagCompliance.html'
    });

    registry.add('adminRoute', 'settings/models', {
        targets: ['administration-sites:6'],
        requiredPermission: 'siteAdminTemplates',
        icon: null,
        label: 'siteSettings:models.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/editframe/default/$lang/sites/$site-key.page-models.html'
    });

    registry.add('adminRoute', 'settings/roles', {
        targets: ['administration-sites:7'],
        requiredPermission: 'siteAdminSiteRoles',
        icon: null,
        label: 'siteSettings:roles.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/editframe/default/$lang/sites/$site-key.manageSiteRoles.html'
    });

    registry.add('adminRoute', 'settings/modules', {
        targets: ['administration-sites:8'],
        requiredPermission: 'siteAdminTemplates',
        icon: null,
        label: 'siteSettings:modules.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/editframe/default/$lang/sites/$site-key.manageModules.html'
    });
};
