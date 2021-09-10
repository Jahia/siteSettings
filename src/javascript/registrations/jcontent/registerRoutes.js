import {registry} from '@jahia/ui-extender';
import {WebPage} from '@jahia/moonstone';
import React from 'react';

export const registerRoutes = function () {
    registry.add('adminRoute', 'models', {
        targets: ['jcontent:6'],
        icon: <WebPage/>,
        label: 'siteSettings:models.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/editframe/default/$lang/sites/$site-key.page-models.html'
    });
};
