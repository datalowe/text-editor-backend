import mongodb from 'mongodb';
import { TextDocument } from '../interfaces/TextDocument';

export function mongoDocToTextDoc(
    mongoDoc: mongodb.Document
): TextDocument {
    const textDoc: TextDocument = {
        ownerId: mongoDoc.ownerId,
        _id: mongoDoc._id,
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
