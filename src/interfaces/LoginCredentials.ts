export interface LoginCredentials {
    username: string,
    password: string
};

export function isLoginCredentials(arg: any): arg is LoginCredentials {
    if (typeof arg !== 'object') {
        return false;
    }
    (['username', 'password']).forEach(propKey => {
        if (!(propKey in arg)) {
            return false;
        }
    });
    if (arg.password.length < 6 || arg.username.length < 3) {
        return false;
    }
    return true;
};
