import {registerRoutes as registerGroupsRoutes} from './groups/registerRoutes';
import {useTranslation} from 'react-i18next';

export default function () {
    const {t} = useTranslation('siteSettings');

    registerGroupsRoutes(t);

    return null;
}
