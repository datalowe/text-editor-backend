export interface NoIdDocument {
    title: string,
    body: string
}

export function isNoIdDocument(arg: any): arg is NoIdDocument {
    if (typeof arg !== 'object') {
        return false;
    }
    (['title', 'body']).forEach(propKey => {
        if (!(propKey in arg)) {
            return false;
        }
    });
    return true;
};
