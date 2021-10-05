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

// only allow users with a valid access token to access list of
// all users
router.get('/list', function(
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

// get a list of all usernames
router.get('/list', async function(
    req: express.Request,
    res: express.Response
) {
    const userList: string[] = await dbFuns.listUsernames(dsn);

    res.json({ usernames: userList });
});

export const userRouter = router;
