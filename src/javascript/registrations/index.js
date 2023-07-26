import {registerRoutes as registerUserRoutes} from './users/registerRoutes';
import {registerRoutes as registerGroupRoutes} from './groups/registerRoutes';
import {registerRoutes as registerSettingsRoutes} from './settings/registerRoutes';
import {registerRoutes as registerJcontentRoutes} from './jcontent/registerRoutes';
import {registerRoutes as registerPropertiesRoutes} from './properties/registerRoutes';

export default function () {
    registerUserRoutes();
    registerGroupRoutes();
    registerSettingsRoutes();
    registerJcontentRoutes();
    registerPropertiesRoutes();
}
