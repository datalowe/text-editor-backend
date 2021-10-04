'use strict';
import mongodb from 'mongodb';
import { NoIdDocument } from './interfaces/NoIdDocument';
import { TextDocument } from './interfaces/TextDocument';

const ObjectId = mongodb.ObjectId;

/**
  * Send a document to a collection.
  *
  * @async
  *
  * @param {string} dsn        DSN for connecting to database.
  * @param {string} colName    Name of collection.
  * @param {string} newDoc     Document (key-value object) to insert into collection.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<string>} String holding generated document _id.
  */
async function sendDocToCollection(
    dsn: string,
    colName: string,
    newDoc: NoIdDocument
): Promise<string> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }

    const client = await mongodb.MongoClient.connect(dsn);
    const db = client.db();
    const col = db.collection(colName);
    const res = await col.insertOne(newDoc);

    await client.close();

    return res.insertedId.toHexString();
}

/**
  * Retrieve all documents in collection.
  *
  * @async
  *
  * @param {string} dsn        DSN for connecting to database.
  * @param {string} colName    Name of collection.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<mongodb.Document[]>} Array of documents in collection.
  */
async function getAllDocsInCollection(
    dsn: string,
    colName: string
): Promise<mongodb.Document[]> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }
    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(colName);
    const res: mongodb.Document[] = await col.find().toArray();

    await client.close();

    return res;
}

/**
  * Retrieve single document in collection.
  *
  * @async
  *
  * @param {string} dsn        DSN for connecting to database.
  * @param {string} colName    Name of collection.
  * @param {string} id         Unique id (_id) of document in collection.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<mongodb.Document>} Object representing matching document in collection.
  */
async function getSingleDocInCollection(
    dsn: string,
    colName: string,
    id: string
): Promise<mongodb.Document> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }
    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(colName);
    const res: mongodb.Document = await col.findOne({ _id: new ObjectId(id) });

    await client.close();

    return res;
}

/**
  * Update a document in a collection.
  *
  * @async
  *
  * @param {string} dsn        DSN for connecting to database.
  * @param {string} colName    Name of collection.
  * @param {object} updatedDoc key-value object, including '_id', 'title' and 'body'
  * with _id of document to update and new title/body values.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<mongodb.Document>} Updated document.
  */
async function updateSingleDocInCollection(
    dsn: string,
    colName: string,
    updatedDoc: TextDocument
): Promise<mongodb.Document> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }
    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(colName);
    const res: mongodb.Document = await col.updateOne(
        {
            _id: new ObjectId(updatedDoc._id)
        },
        {
            $set: {
                title: updatedDoc.title,
                body: updatedDoc.body
            }
        }
    );

    await client.close();

    return res;
}

export {
    getAllDocsInCollection,
    getSingleDocInCollection,
    sendDocToCollection,
    updateSingleDocInCollection
};
