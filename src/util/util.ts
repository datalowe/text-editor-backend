import mongodb from 'mongodb';
import { Editor } from '../interfaces/Editor';
import { TextDocument } from '../interfaces/TextDocument';

export function mongoDocToTextDoc(
    mongoDoc: mongodb.Document
): TextDocument {
    const textDoc: TextDocument = {
        ownerId: mongoDoc.ownerId,
        id: mongoDoc._id,
        editorIds: mongoDoc.editorIds,
        title: mongoDoc.title,
        body: mongoDoc.body
    };

    return textDoc;
}

// check if passed id is a valid document id (standard mongoDB
// auto-generated id)
export function isValidId(
    id: any
): boolean {
    return typeof id === 'string' && id.length === 24;
}

export function mongoDocToEditor(
    mongoDoc: mongodb.Document
): Editor {
    const editor: Editor = {
        id: mongoDoc._id,
        username: mongoDoc.username
    };

    return editor;
}

export function textDocToPDFTemplate(
    doc: TextDocument
): string {
    const docTemplate = `<h1 style="text-align: center;">${doc.title}</h1>` + doc.body;

    return docTemplate;
}
