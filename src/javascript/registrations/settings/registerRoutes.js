import React from 'react';
import {registry} from '@jahia/ui-extender';
import {Crown, Language, Module} from '@jahia/moonstone';

export const registerRoutes = function () {
    registry.add('adminRoute', 'settings/languages', {
        targets: ['administration-sites:40'],
        requiredPermission: 'siteAdminLanguages',
        icon: <Language/>,
        label: 'siteSettings:languages.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/editframe/default/$lang/sites/$site-key.manageLanguages.html'
    });

    // TODO BACKLOG-13371 add these lines or removed them definitely
    /* Registry.add('adminRoute', 'settings/wcag', {
        targets: ['administration-sites:60'],
        requiredPermission: 'siteAdminWcagCompliance',
        icon: <Accessibility/>,
        label: 'siteSettings:wcag.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/editframe/default/$lang/sites/$site-key.wcagCompliance.html'
    }); */

    registry.add('adminRoute', 'settings/roles', {
        targets: ['administration-sites:30'],
        requiredPermission: 'siteAdminSiteRoles',
        icon: <Crown/>,
        label: 'siteSettings:roles.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/editframe/default/$lang/sites/$site-key.manageSiteRoles.html'
    });

    registry.add('adminRoute', 'settings/modules', {
        targets: ['administration-sites:70'],
        requiredPermission: 'siteAdminTemplates',
        icon: <Module/>,
        label: 'siteSettings:modules.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/editframe/default/$lang/sites/$site-key.manageModules.html'
    });
};
