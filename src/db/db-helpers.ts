import mongodb from 'mongodb';

export async function getMongoClientCollection(
    dsn: string, colName: string
): Promise<[mongodb.MongoClient, mongodb.Collection]> {
    if (process.env.NODE_ENV === 'test') {
        dsn = process.env.MONGO_URI;
    }

    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(dsn);
    const db: mongodb.Db = client.db();
    const col: mongodb.Collection = db.collection(colName);

    return [client, col];
}
