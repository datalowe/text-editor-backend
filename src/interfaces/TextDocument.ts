export interface TextDocument {
    _id: string,
    title: string,
    body: string,
    ownerId: string,
    editorIds: string[]
}

export function isTextDocument(arg: any): arg is TextDocument {
    if (typeof arg !== 'object') {
        return false;
    }
    (['_id', 'title', 'body', 'ownerId', 'editorIds']).forEach(propKey => {
        if (!(propKey in arg)) {
            return false;
        }
    });
    if (!(arg.editorIds instanceof Array)) {
        return false;
    }
    return true;
};
