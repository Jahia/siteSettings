import registrations from './registrations';
import {registry} from '@jahia/ui-extender';
import i18next from 'i18next';

registry.add('callback', 'siteSettings', {
    targets: ['jahiaApp-init:50'],
    callback: async () => {
        await i18next.loadNamespaces('siteSettings');
        registrations();
        console.log('%c Site Settings routes have been registered', 'color: #3c8cba');
    }
});
