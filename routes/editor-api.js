const dbFuns = require('../src/db-functions.js');
const express = require('express');

const router = express.Router();

let envConfig;


if (process.env.DB_USERNAME) {
    envConfig = {
        dbUsername: process.env.DB_USERNAME,
        dbPassword: process.env.DB_PASSWORD,
        dbHost: process.env.DB_HOST,
        dbName: process.env.DB_NAME,
        dbUriPrefix: process.env.DB_URI_PREFIX,
    };
} else {
    envConfig = require('../env_config.json');
}

const dsn = `${envConfig.dbUriPrefix}://${envConfig.dbUsername}:${envConfig.dbPassword}@${envConfig.dbHost}/${envConfig.dbName}?retryWrites=true&w=majority`;
const colName = 'editorDocs';

router.get('/document', async function(req, res, next) {
    const searchResult = await dbFuns.getAllDocsInCollection(dsn, colName);

    res.json(searchResult);
});

router.get('/document/:id', async function(req, res, next) {
    const searchResult = await dbFuns.getSingleDocInCollection(dsn, colName, req.params.id);

    res.json(searchResult);
});

router.put('/document/:id', async function(req, res, next) {
    if (!('title' in req.body)) {
        res.json({'error': 'missing_title'});
        return;
    }
    if (!('body' in req.body)) {
        res.json({'error': 'missing_body'});
        return;
    }
    const updatedDoc = {
        _id: req.params.id,
        title: req.body.title,
        body: req.body.body
    }
    const sendResult = await dbFuns.updateSingleDocInCollection(
        dsn, 
        colName, 
        updatedDoc
    );
    if (('acknowledged' in sendResult) && sendResult.acknowledged) {
        res.json(updatedDoc)
    }
    else {
        res.json(sendResult);
    }
});

router.post('/document', async function(req, res, next) {
    if (!('title' in req.body)) {
        res.json({'error': 'missing_title'});
        return;
    }
    if (!('body' in req.body)) {
        res.json({'error': 'missing_body'});
        return;
    }
    const newDoc = {
        title: req.body.title,
        body: req.body.body
    }
    const sendResult = await dbFuns.sendDocToCollection(dsn, colName, newDoc);
    if ('_id' in sendResult) {
        newDoc._id = sendResult._id;
        res.json(newDoc);
    } else {
        res.json(sendResult);
    }
});

module.exports = router;