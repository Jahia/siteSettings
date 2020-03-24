import {registry} from '@jahia/ui-extender';

export const registerRoutes = function () {
    registry.add('adminRoute', 'models', {
        targets: ['jcontent:6'],
        icon: null,
        label: 'siteSettings:models.label',
        isSelectable: true,
        iframeUrl: window.contextJsParameters.contextPath + '/cms/editframe/default/$lang/sites/$site-key.page-models.html'
    });
};
