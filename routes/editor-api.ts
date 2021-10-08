'use strict';
import mongodb from 'mongodb';
import * as dbFuns from '../src/db-functions.js';
import express from 'express';
import { TextDocument } from '../src/interfaces/TextDocument.js';
import { isNoIdDocument, NoIdDocument } from '../src/interfaces/NoIdDocument.js';
import { dsn } from '../app.js';
import jwt from 'jsonwebtoken';
import * as docRel from '../src/auth_util/doc-relationships.js';
import { mongoDocToTextDoc } from '../src/util/util.js';

const router: express.Router = express.Router();
const colName: string = 'editorDocs';

// only allow users with a valid access token to access any of the
// editor endpoints
router.all('*', function(
    req: express.Request,
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
        next();
    });
});

router.get('/document', async function(
    req: express.Request,
    res: express.Response
) {
    const username: string = docRel.extractUsername(req);

    const searchResult: mongodb.Document[] = await dbFuns.getRelatedDocsInCollection(
        dsn,
        colName,
        username
    );

    res.json(searchResult);
});

router.get('/document/:id', async function(
    req: express.Request,
    res: express.Response
) {
    if ((typeof req.params.id === 'string') && (req.params.id.length === 24)) {
        const username = docRel.extractUsername(req);
        const searchResult: mongodb.Document | null = await dbFuns.getSingleDocInCollection(
            dsn,
            colName,
            req.params.id
        );

        if (searchResult == null) {
            res.json({ error: 'matching_document_not_found' });
            return;
        }

        const textDoc: TextDocument = mongoDocToTextDoc(searchResult);

        if (!docRel.hasDocumentAccess(username, textDoc, false)) {
            res.json({ error: 'user_does_not_have_access_to_document' });
            return;
        }

        res.json(searchResult);
    }
    res.json({ error: 'invalid_id' });
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
        _id: req.params.id,
        title: req.body.title,
        body: req.body.body,
        owner: req.body.owner,
        editors: req.body.editors
    };
    const sendResult: mongodb.Document = await dbFuns.updateSingleDocInCollection(
        dsn,
        colName,
        updatedDoc
    );

    if (('acknowledged' in sendResult) && sendResult.acknowledged) {
        res.json(updatedDoc);
    } else {
        res.json(sendResult);
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
        owner: req.body.owner,
        editors: req.body.editors
    };
    const sendResult: string = await dbFuns.sendDocToCollection(dsn, colName, newDoc);

    const returnDoc = {
        _id: sendResult,
        title: req.body.title,
        body: req.body.body
    };

    res.json(returnDoc);
});

export const editorRouter = router;
