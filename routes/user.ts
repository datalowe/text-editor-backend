'use strict';
import * as dbFuns from '../src/db-functions.js';
import express from 'express';
import { dsn } from '../app.js';
import { isLoginCredentials } from '../src/interfaces/LoginCredentials.js';
import jwt from 'jsonwebtoken';

const router: express.Router = express.Router();

router.post('/register', async function(
    req: express.Request,
    res: express.Response
) {
    if (!isLoginCredentials(req.body)) {
        res.json({ error: 'invalid_credentials' });
        return;
    }
    const creationResult: boolean = await dbFuns.createUser(dsn, req.body);

    res.statusCode = 201;
    res.json(creationResult);
});

router.post('/login', async function(
    req: express.Request,
    res: express.Response
) {
    if (!isLoginCredentials(req.body)) {
        res.json({ error: 'invalid_credentials' });
        return;
    }
    const isValidLogin: boolean = await dbFuns.checkUserCredentials(dsn, req.body);

    if (isValidLogin) {
        const token: jwt.Secret = jwt.sign(
            { username: req.body.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token: token });
        return;
    }
    res.json({ error: 'invalid_credentials' });
});

export const userRouter = router;
