import {registerRoutes as registerGroupsRoutes} from './groups/registerRoutes';
import {registerRoutes as registerUsersRoutes} from './users/registerRoutes';
import {useTranslation} from 'react-i18next';

export default function () {
    const {t} = useTranslation('siteSettings');

    registerGroupsRoutes(t);
    registerUsersRoutes(t);

    return null;
}
