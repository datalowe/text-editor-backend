export interface NoIdDocument {
    title: string,
    body: string,
    owner: string,
    editors: string[]
}

export function isNoIdDocument(arg: any): arg is NoIdDocument {
    if (typeof arg !== 'object') {
        return false;
    }
    (['title', 'body', 'owner', 'editors']).forEach(propKey => {
        if (!(propKey in arg)) {
            return false;
        }
    });
    if (!(arg.editors instanceof Array)) {
        return false;
    }
    return true;
};
