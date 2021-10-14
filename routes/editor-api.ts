'use strict';
import mongodb from 'mongodb';
import * as dbFuns from '../src/db-functions.js';
import express from 'express';
import { TextDocument } from '../src/interfaces/TextDocument.js';
import { isNoIdDocument, NoIdDocument } from '../src/interfaces/NoIdDocument.js';
import { dsn } from '../app.js';
import jwt from 'jsonwebtoken';
import * as docRel from '../src/auth_util/doc-relationships.js';
import { graphqlHTTP } from 'express-graphql';
import { graphSchema } from '../src/graphql/graphql-schema.js';
import { UserIdRequest } from '../src/interfaces/UserIdRequest.js';
import { DocumentNotFoundException } from '../src/exceptions/DocumentNotFoundException.js';
import { isValidId } from '../src/util/util.js';

const router: express.Router = express.Router();
const colName: string = 'editorDocs';

// only allow users with a valid access token to access any of the
// editor endpoints
router.all('*', function(
    req: UserIdRequest,
    res: express.Response,
    next: any
) {
    if (!req.headers['x-access-token']) {
        res.json({ authentication_error: 'x-access-token header missing' });
        return;
    }
    const token = docRel.extractToken(req);

    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
        if (err) {
            res.json({ authentication_error: err });
            return;
        }
        const userId: string = docRel.extractUserId(req);

        req.userId = userId;

        next();
    });
});

// GraphQL endpoint
router.use('/graphql', graphqlHTTP({
    schema: graphSchema,
    graphiql: process.env.ENABLE_GRAPHIQL === 'true'
}));

router.get('/document', async function(
    req: UserIdRequest,
    res: express.Response
) {
    const searchResult: mongodb.Document[] = await dbFuns.getRelatedDocsInCollection(
        dsn,
        colName,
        req.userId
    );

    res.json(searchResult);
});

router.get('/document/:id', async function(
    req: UserIdRequest,
    res: express.Response
) {
    if (!isValidId(req.params.id)) {
        res.json({ error: 'invalid_id' });
        return;
    }
    try {
        const searchResult: TextDocument = await dbFuns.getSingleDocInCollection(
            dsn,
            colName,
            req.params.id,
            req.userId
        );

        res.json(searchResult);
    } catch (e) {
        if (e instanceof DocumentNotFoundException) {
            res.json({ error: 'matching_document_not_found' });
            return;
        }
        res.json({ error: 'internal_error' });
    }
});

router.put('/document/:id', async function(
    req: express.Request,
    res: express.Response
) {
    if (!isNoIdDocument(req.body)) {
        res.json({ error: 'invalid_data' });
        res.statusCode = 400;
        return;
    }
    const updatedDoc: TextDocument = {
        id: req.params.id,
        title: req.body.title,
        body: req.body.body,
        ownerId: req.body.ownerId,
        editorIds: req.body.editorIds
    };

    try {
        await dbFuns.updateSingleDocInCollection(
            dsn, colName, updatedDoc
        );

        res.json(updatedDoc);
    } catch (e) {
        if (e instanceof DocumentNotFoundException) {
            res.json({ error: 'document_not_found' });
        } else {
            res.json({ error: 'internal_error' });
        }
    }
});

router.post('/document', async function(
    req: express.Request,
    res: express.Response
) {
    if (!isNoIdDocument(req.body)) {
        res.json({ error: 'invalid_data' });
        res.statusCode = 400;
        return;
    }
    const newDoc: NoIdDocument = {
        title: req.body.title,
        body: req.body.body,
        ownerId: req.body.ownerId,
        editorIds: req.body.editorIds
    };
    const sendResult: string = await dbFuns.sendDocToCollection(dsn, colName, newDoc);

    const returnDoc = {
        id: sendResult,
        title: req.body.title,
        body: req.body.body
    };

    res.json(returnDoc);
});

export const editorRouter = router;
