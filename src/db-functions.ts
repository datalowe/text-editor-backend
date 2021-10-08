'use strict';
import bcrypt from 'bcryptjs';
import mongodb from 'mongodb';
import { NoIdDocument } from './interfaces/NoIdDocument';
import { TextDocument } from './interfaces/TextDocument';
import { LoginCredentials } from './interfaces/LoginCredentials';

const numSaltRounds = 10;
const userColName: string = 'editorUsers';

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

    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(colName);
    const res: mongodb.Document = await col.insertOne(newDoc);

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
  * Retrieve documents in collection which have the passed username as
  * owner or in array of editors.
  *
  * @async
  *
  * @param {string} dsn        DSN for connecting to database.
  * @param {string} colName    Name of collection.
  * @param {string} username   Name of user.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<mongodb.Document[]>} Array of documents in collection.
  */
async function getRelatedDocsInCollection(
    dsn: string,
    colName: string,
    username: string
): Promise<mongodb.Document[]> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }
    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(colName);
    const res: mongodb.Document[] = await col.find({
        $or: [
            {
                owner: username
            },
            {
                editors: { $in: [username] }
            }
        ]
    }).toArray();

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
    const res: mongodb.Document = await col.findOne({
        _id: new mongodb.ObjectId(id)
    });

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
            _id: new mongodb.ObjectId(updatedDoc._id)
        },
        {
            $set: {
                title: updatedDoc.title,
                body: updatedDoc.body,
                owner: updatedDoc.owner,
                editors: updatedDoc.editors
            }
        }
    );

    await client.close();

    return res;
}

/**
  * Create a new editor user.
  *
  * @async
  *
  * @param {string} dsn                 DSN for connecting to database.
  * @param {LoginCredentials} userInfo  User credentials.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<boolean>} Always true.
  */
async function createUser(
    dsn: string,
    userInfo: LoginCredentials
): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }

    const hashedPassword = await bcrypt.hash(userInfo.password, numSaltRounds);
    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(userColName);

    await col.insertOne({
        username: userInfo.username,
        password: hashedPassword
    });

    await client.close();

    return true;
}

/**
  * Create a new editor user.
  *
  * @async
  *
  * @param {string} dsn                     DSN for connecting to database.
  * @param {LoginCredentials} checkCreds    User credentials to validate.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<boolean>} True if credentials are valid, otherwise false.
  */
async function checkUserCredentials(
    dsn: string,
    userInfo: LoginCredentials
): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }

    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(userColName);

    const dbRes: mongodb.Document = await col.findOne({
        username: userInfo.username
    });

    if (!dbRes) {
        return false;
    }

    await client.close();

    const isValid: boolean = await bcrypt.compare(userInfo.password, dbRes.password);

    return isValid;
}

/**
  * Get an array of all usernames.
  *
  * @async
  *
  * @param {string} dsn                     DSN for connecting to database.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<string[]>} True if credentials are valid, otherwise false.
  */
async function listUsernames(
    dsn: string
): Promise<string[]> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }

    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(userColName);

    const userDocs: mongodb.Document[] = await col.find().toArray();

    await client.close();

    const userNames: string[] = userDocs.map(uDoc => uDoc.username);

    return userNames;
}

export {
    checkUserCredentials,
    createUser,
    getAllDocsInCollection,
    getRelatedDocsInCollection,
    getSingleDocInCollection,
    listUsernames,
    sendDocToCollection,
    updateSingleDocInCollection
};
