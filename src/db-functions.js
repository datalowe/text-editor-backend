const mongo = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

/**
  * Send a document to a collection.
  *
  * @async
  *
  * @param {string} dsn        DSN to connect to database.
  * @param {string} colName    Name of collection.
  * @param {object} newDoc     Document (key-value object) to insert into collection.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<String>} String holding generated document _id.
  */
  async function sendDocToCollection(dsn, colName, newDoc) {
    const client  = await mongo.connect(dsn);
    const db = client.db();
    const col = db.collection(colName);
    const res = await col.insertOne(newDoc);

    await client.close();

    return {'_id': res.insertedId.toHexString()};
}

/**
  * Retrieve all documents in collection.
  *
  * @async
  *
  * @param {string} dsn        DSN to connect to database.
  * @param {string} colName    Name of collection.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<Array<Object>>} Array of objects representing documents in collection.
  */
 async function getAllDocsInCollection(dsn, colName) {
  const client  = await mongo.connect(dsn);
  const db = client.db();
  const col = db.collection(colName);
  const res = await col.find().toArray();

  await client.close();

  return res;
}

/**
  * Retrieve single document in collection.
  *
  * @async
  *
  * @param {string} dsn        DSN to connect to database.
  * @param {string} colName    Name of collection.
  * @param {string} id         Unique id (_id) of document in collection.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<Object>} Object representing matching document in collection.
  */
 async function getSingleDocInCollection(dsn, colName, id) {
  const client  = await mongo.connect(dsn);
  const db = client.db();
  const col = db.collection(colName);
  const res = await col.findOne({'_id': ObjectId(id)});

  console.log(res);

  await client.close();

  return res;
}

/**
  * Update a document in a collection.
  *
  * @async
  *
  * @param {string} dsn        DSN to connect to database.
  * @param {string} colName    Name of collection.
  * @param {object} updatedDoc key-value object, including '_id', 'title' and 'body' 
  * with _id of document to update and new title/body values.
  *
  * @throws Error when database operation fails.
  *
  * @return {Promise<UpdateResult>} Results of update.
  */
 async function updateSingleDocInCollection(dsn, colName, updatedDoc) {
  const client  = await mongo.connect(dsn);
  const db = client.db();
  const col = db.collection(colName);
  const res = await col.updateOne(
    {
      '_id': ObjectId(updatedDoc._id)
    },
    {
      $set: {
      'title': updatedDoc.title,
      'body': updatedDoc.body
      }
    }
  );

  await client.close();

  return res;
}


module.exports = {
    "getAllDocsInCollection": getAllDocsInCollection,
    "getSingleDocInCollection": getSingleDocInCollection,
    "sendDocToCollection": sendDocToCollection,
    "updateSingleDocInCollection": updateSingleDocInCollection
};