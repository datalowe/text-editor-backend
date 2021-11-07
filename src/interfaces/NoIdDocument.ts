export interface NoIdDocument {
    title: string,
    body: string,
    ownerId: string,
    editorIds: string[],
    type: string
}

export function isNoIdDocument(arg: any): arg is NoIdDocument {
    if (typeof arg !== 'object') {
        return false;
    }
    (['title', 'body', 'ownerId', 'editorIds', 'type']).forEach(propKey => {
        if (!(propKey in arg)) {
            return false;
        }
    });
    if (!(arg.editorIds instanceof Array)) {
        return false;
    }
    if (!['regular', 'code'].includes(arg.type)) {
        return false;
    }
    return true;
};
