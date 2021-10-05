import mongodb from 'mongodb';
import { TextDocument } from '../interfaces/TextDocument';

export function mongoDocToTextDoc(
    mongoDoc: mongodb.Document
): TextDocument {
    const textDoc: TextDocument = {
        owner: mongoDoc.owner,
        _id: mongoDoc._id,
        editors: mongoDoc.editors,
        title: mongoDoc.title,
        body: mongoDoc.body
    };

    return textDoc;
}
