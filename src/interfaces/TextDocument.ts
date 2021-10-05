export interface TextDocument {
    _id: string,
    title: string,
    body: string,
    owner: string,
    editors: string[]
}

export function isTextDocument(arg: any): arg is TextDocument {
    if (typeof arg !== 'object') {
        return false;
    }
    (['_id', 'title', 'body', 'owner', 'editors']).forEach(propKey => {
        if (!(propKey in arg)) {
            return false;
        }
    });
    if (!(arg.editors instanceof Array)) {
        return false;
    }
    return true;
};
