import { IUser } from '../api/models/User.model';

declare global {
    namespace Express {
        /**
         * Extend the Express Request interface to include the user property
         * This will be used to attach the authenticated user to the request object.
         */
        interface Request {
            user?: IUser;
        }
    }
}