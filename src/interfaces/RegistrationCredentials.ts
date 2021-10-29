import { isLoginCredentials, LoginCredentials } from './LoginCredentials.js';

export interface RegistrationCredentials extends LoginCredentials {
    // eslint-disable-next-line camelcase
    invitation_code?: string
}

export function isRegistrationCredentials(arg: any): arg is RegistrationCredentials {
    return isLoginCredentials(arg);
}
