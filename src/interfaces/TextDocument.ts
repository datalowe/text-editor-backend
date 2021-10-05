export interface TextDocument {
    _id: string,
    title: string,
    body: string
}

export function isTextDocument(arg: any): arg is TextDocument {
    if (typeof arg !== 'object') {
        return false;
    }
    (['_id', 'title', 'body']).forEach(propKey => {
        if (!(propKey in arg)) {
            return false;
        }
    });
    return true;
};
