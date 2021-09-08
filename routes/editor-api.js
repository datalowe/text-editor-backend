const envConfig = require('../env_config.json');
const dbFuns = require('../src/db-functions.js');
const express = require('express');

const router = express.Router();

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

router.put('/document/update', async function(req, res, next) {
    if (!('title' in req.body)) {
        res.json({'error': 'missing_title'});
    }
    else if (!('body' in req.body)) {
        res.json({'error': 'missing_body'});
    }
    else if (!('_id' in req.body)) {
        res.json({'error': 'missing_id'})
    }
    else {
        const sendResult = await dbFuns.updateSingleDocInCollection(
            dsn, 
            colName, 
            req.body
        );
        console.log(sendResult);
        res.json(sendResult);
    }
});

router.post('/document/create', async function(req, res, next) {
    if (!('title' in req.body)) {
        res.json({'error': 'missing_title'});
    }
    else if (!('body' in req.body)) {
        res.json({'error': 'missing_body'});
    }
    else {
        const sendResult = await dbFuns.sendDocToCollection(dsn, colName, req.body);
        res.json(sendResult);
    }
});

module.exports = router;