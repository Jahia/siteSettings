import {registerRoutes as registerUserRoutes} from './users/registerRoutes';
import {registerRoutes as registerGroupRoutes} from './groups/registerRoutes';

export default function () {
    registerUserRoutes();
    registerGroupRoutes();
}
