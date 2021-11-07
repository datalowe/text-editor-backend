export interface TextDocument {
    id: string,
    title: string,
    body: string,
    ownerId: string,
    editorIds: string[],
    type: string
}

export function isTextDocument(arg: any): arg is TextDocument {
    if (typeof arg !== 'object') {
        return false;
    }
    (['id', 'title', 'body', 'ownerId', 'editorIds', 'type']).forEach(propKey => {
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
