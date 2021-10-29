'use strict';
import bcrypt from 'bcryptjs';
import mongodb from 'mongodb';

import { NoIdDocument } from './interfaces/NoIdDocument';
import { TextDocument } from './interfaces/TextDocument';
import { LoginCredentials } from './interfaces/LoginCredentials';
import { UserNotFoundException } from './exceptions/UserNotFoundException.js';
import { DatabaseException } from './exceptions/DatabaseException.js';
import { IncorrectPasswordException } from './exceptions/IncorrectPasswordException.js';
import { DocumentNotFoundException } from './exceptions/DocumentNotFoundException.js';
import { mongoDocToEditor, mongoDocToTextDoc } from './util/util.js';
import { Editor } from './interfaces/Editor';

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
  * @return {Promise<string>} String holding generated document id.
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
  * Retrieve documents in collection which have the passed username as
  * owner or in array of editors.
  *
  * @async
  *
  * @param {string} dsn        DSN for connecting to database.
  * @param {string} colName    Name of collection.
  * @param {string} userId     Unique id of request user.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<TextDocument[]>} Array of documents in collection.
  */
async function getRelatedDocsInCollection(
    dsn: string,
    colName: string,
    userId: string
): Promise<TextDocument[]> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }
    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(colName);
    const res: mongodb.Document[] = await col.find({
        $or: [
            {
                ownerId: userId
            },
            {
                editorIds: { $in: [userId] }
            }
        ]
    }).toArray();

    await client.close();

    return res.map(doc => mongoDocToTextDoc(doc));
}

/**
  * Retrieve single document in collection, if passed user ID matches the
  * document's owner ID or one of its editor ID's.
  *
  * @async
  *
  * @param {string} dsn        DSN for connecting to database.
  * @param {string} colName    Name of collection.
  * @param {string} id         Unique id of document in collection.
  * @param {string} userId     Unique id of request user.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<TextDocument>} Object representing matching document in collection.
  */
async function getSingleDocInCollection(
    dsn: string,
    colName: string,
    docId: string,
    userId: string
): Promise<TextDocument> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }
    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(colName);
    const res: mongodb.Document = await col.findOne({
        _id: new mongodb.ObjectId(docId),
        $or: [
            {
                ownerId: userId
            },
            {
                editorIds: { $in: [userId] }
            }
        ]
    });

    await client.close();

    if (res == null) {
        throw new DocumentNotFoundException('No matching document could be found.');
    }

    return mongoDocToTextDoc(res);
}

/**
  * Update a document in a collection.
  *
  * @async
  *
  * @param {string} dsn        DSN for connecting to database.
  * @param {string} colName    Name of collection.
  * @param {object} updatedDoc key-value object, including 'id', 'title' and 'body'
  * with id of document to update and new title/body values.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<mongodb.Document>} Updated document.
  */
async function updateSingleDocInCollection(
    dsn: string,
    colName: string,
    updatedDoc: TextDocument
): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }
    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(colName);
    const res: mongodb.Document = await col.updateOne(
        {
            _id: new mongodb.ObjectId(updatedDoc.id)
        },
        {
            $set: {
                title: updatedDoc.title,
                body: updatedDoc.body,
                editorIds: updatedDoc.editorIds
            }
        }
    );

    await client.close();

    if (res == null) {
        throw new DatabaseException('Something went wrong with update request to database.');
    }
    if (res.matchedCount === 0) {
        throw new DocumentNotFoundException('No matching document could be found.');
    }
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
): Promise<string> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }

    const hashedPassword = await bcrypt.hash(userInfo.password, numSaltRounds);
    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(userColName);

    const createdUser: mongodb.Document = await col.insertOne({
        username: userInfo.username,
        password: hashedPassword
    });

    await client.close();

    return createdUser.insertedId.toString();
}

/**
  * Get user ID.
  *
  * @async
  *
  * @param {string} dsn                     DSN for connecting to database.
  * @param {LoginCredentials} checkCreds    User credentials to validate.
  *
  * @throws {UserNotFoundException} If user matching username is not found in database.
  * @throws {IncorrectPasswordException} If user password is incorrect.
  *
  * @return {Promise<string>} True if credentials are valid, otherwise false.
  */
async function getUserId(
    dsn: string,
    userInfo: LoginCredentials
): Promise<string> {
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
        throw new UserNotFoundException('User not found.');
    }

    await client.close();

    const isValid: boolean = await bcrypt.compare(userInfo.password, dbRes.password);

    if (!isValid) {
        throw new IncorrectPasswordException('Incorrect password');
    }

    return dbRes._id;
}

/**
  * Get user ID.
  *
  * @async
  *
  * @param {string} dsn                     DSN for connecting to database.
  * @param {string} userId                  User ID to look up editor by.
  *
  * @throws {UserNotFoundException} If user matching id is not found in database.
  *
  * @return {Promise<Editor>} Editor corresponding to passed user ID.
  */
async function getSingleEditor(
    dsn: string,
    userId: string
): Promise<Editor> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }

    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(userColName);

    const dbRes: mongodb.Document = await col.findOne({
        _id: new mongodb.ObjectId(userId)
    });

    if (!dbRes) {
        throw new UserNotFoundException('User not found.');
    }

    await client.close();

    return mongoDocToEditor(dbRes);
}

/**
  * Get user ID.
  *
  * @async
  *
  * @param {string} dsn                     DSN for connecting to database.
  * @param {string} userId                  User ID to look up editor by.
  *
  * @throws {UserNotFoundException} If user matching id is not found in database.
  *
  * @return {Promise<Editor>} Editor corresponding to passed user ID.
  */
async function getMultipleEditors(
    dsn: string,
    userIds: string[]
): Promise<Editor[]> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }

    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(userColName);

    const editorDocs: mongodb.Document[] = await col.find({
        _id: {
            $in: userIds.map(id => new mongodb.ObjectId(id))
        }
    }).toArray();

    await client.close();

    return editorDocs.map((eDoc: mongodb.Document) => mongoDocToEditor(eDoc));
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

    const usernames: string[] = userDocs.map(uDoc => uDoc.username);

    return usernames;
}

/**
  * Get an array of all editors.
  *
  * @async
  *
  * @param {string} dsn                     DSN for connecting to database.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<Editor[]>} True if credentials are valid, otherwise false.
  */
async function listEditors(
    dsn: string
): Promise<Editor[]> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }

    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(userColName);

    const editorDocs: mongodb.Document[] = await col.find().toArray();

    await client.close();

    const editors: Editor[] = editorDocs.map(eDoc => mongoDocToEditor(eDoc));

    return editors;
}

export {
    createUser,
    getRelatedDocsInCollection,
    getMultipleEditors,
    getSingleDocInCollection,
    getSingleEditor,
    getUserId,
    listEditors,
    listUsernames,
    sendDocToCollection,
    updateSingleDocInCollection
};
