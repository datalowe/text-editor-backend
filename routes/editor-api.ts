'use strict';
import mongodb from 'mongodb';
import * as dbFuns from '../src/db-functions.js';
import express from 'express';
import { TextDocument } from '../src/interfaces/TextDocument.js';

const router = express.Router();

let dsn;

if (process.env.NODE_ENV === 'test') {
    dsn = '';
} else {
    dsn = `${process.env.DB_URI_PREFIX}://${process.env.DB_USERNAME}:` +
        `${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}` +
        '?retryWrites=true&w=majority';
}

const colName = 'editorDocs';

router.get('/document', async function(
    req: express.Request,
    res: express.Response
) {
    const searchResult: mongodb.Document[] = await dbFuns.getAllDocsInCollection(dsn, colName);

    res.json(searchResult);
});

router.get('/document/:id', async function(req, res) {
    if ((typeof req.params.id === 'string') && (req.params.id.length === 24)) {
        const searchResult = await dbFuns.getSingleDocInCollection(dsn, colName, req.params.id);

        if (searchResult == null) {
            res.json({ error: 'matching_document_not_found' });
            return;
        }
        res.json(searchResult);
        return;
    }
    res.json({ error: 'invalid_id' });
});

router.put('/document/:id', async function(
    req: express.Request,
    res: express.Response
) {
    if (!('title' in req.body)) {
        res.json({ error: 'missing_title' });
        return;
    }
    if (!('body' in req.body)) {
        res.json({ error: 'missing_body' });
        return;
    }
    const updatedDoc: TextDocument = {
        _id: req.params.id,
        title: req.body.title,
        body: req.body.body
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

router.post('/document', async function(req, res) {
    if (!('title' in req.body)) {
        res.json({ error: 'missing_title' });
        return;
    }
    if (!('body' in req.body)) {
        res.json({ error: 'missing_body' });
        return;
    }
    const newDoc = {
        title: req.body.title,
        body: req.body.body
    };
    const sendResult = await dbFuns.sendDocToCollection(dsn, colName, newDoc);

    const returnDoc = {
        _id: sendResult,
        title: req.body.title,
        body: req.body.body
    };

    res.json(returnDoc);
});

export const editorRouter = router;
