'use strict';
import mongodb from 'mongodb';
import * as dbFuns from '../src/db-functions.js';
import express from 'express';
import { TextDocument } from '../src/interfaces/TextDocument.js';
import { isNoIdDocument, NoIdDocument } from '../src/interfaces/NoIdDocument.js';
import { dsn } from '../app.js';
import jwt from 'jsonwebtoken';

const router: express.Router = express.Router();
const colName: string = 'editorDocs';

// only allow users with a valid access token to access any of the
// editor endpoints
router.all('*', function(
    req: express.Request,
    res: express.Response,
    next: any
) {
    let token: string;

    if (typeof req.headers['x-access-token'] === 'string') {
        token = req.headers['x-access-token'];
    } else {
        token = req.headers['x-access-token'][0];
    }

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
    const searchResult: mongodb.Document[] = await dbFuns.getAllDocsInCollection(dsn, colName);

    res.json(searchResult);
});

router.get('/document/:id', async function(
    req: express.Request,
    res: express.Response
) {
    if ((typeof req.params.id === 'string') && (req.params.id.length === 24)) {
        const searchResult: mongodb.Document | null = await dbFuns.getSingleDocInCollection(
            dsn,
            colName,
            req.params.id
        );

        if (searchResult == null) {
            res.json({ error: 'matching_document_not_found' });
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
