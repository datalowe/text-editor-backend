export interface NoIdDocument {
    title: string,
    body: string,
    ownerId: string,
    editorIds: string[]
}

export function isNoIdDocument(arg: any): arg is NoIdDocument {
    if (typeof arg !== 'object') {
        return false;
    }
    (['title', 'body', 'ownerId', 'editorIds']).forEach(propKey => {
        if (!(propKey in arg)) {
            return false;
        }
    });
    if (!(arg.editorIds instanceof Array)) {
        return false;
    }
    return true;
};
