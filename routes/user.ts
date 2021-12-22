'use strict';
import * as dbFuns from '../src/db/db-functions.js';
import express from 'express';
import { dsn } from '../app.js';
import { isLoginCredentials } from '../src/interfaces/LoginCredentials.js';
import jwt from 'jsonwebtoken';
import { UserNotFoundException } from '../src/exceptions/UserNotFoundException.js';
import { IncorrectPasswordException } from '../src/exceptions/IncorrectPasswordException.js';
import { isRegistrationCredentials } from '../src/interfaces/RegistrationCredentials.js';
import {
    extractDocIdFromInvitationToken,
    extractInviterIdFromInvitationToken
} from '../src/util/auth_util/doc-relationships.js';
import { TextDocument } from '../src/interfaces/TextDocument.js';
import { DocumentNotFoundException } from '../src/exceptions/DocumentNotFoundException.js';
import { InvalidTokenException } from '../src/exceptions/InvalidTokenException.js';

const docColName: string = 'editorDocs';

const router: express.Router = express.Router();

router.post('/register', async function(
    req: express.Request,
    res: express.Response
) {
    if (!isRegistrationCredentials(req.body)) {
        res.json({ error: 'invalid_credentials' });
        return;
    }
    const createdUserId: string = await dbFuns.createUser(dsn, req.body);

    if (req.body.invitation_code) {
        try {
            const docId: string = extractDocIdFromInvitationToken(req.body.invitation_code);
            const inviterId: string = extractInviterIdFromInvitationToken(req.body.invitation_code);

            const matchDoc: TextDocument = await dbFuns.getSingleDocInCollection(
                dsn,
                docColName,
                docId,
                inviterId
            );

            matchDoc.editorIds.push(createdUserId);

            dbFuns.updateSingleDocInCollection(
                dsn,
                docColName,
                matchDoc
            );
        } catch (e) {
            if (e instanceof DocumentNotFoundException) {
                res.json({ error: 'matching_document_not_found' });
                return;
            } else if (e instanceof InvalidTokenException) {
                res.json({ error: 'invalid_invitation_code' });
                return;
            } else {
                res.json({ error: 'internal_error' });
            }
        }
    }

    res.statusCode = 201;
    res.json({ success: 'user_created' });
});

router.post('/login', async function(
    req: express.Request,
    res: express.Response
) {
    if (!isLoginCredentials(req.body)) {
        res.json({ error: 'invalid_credentials' });
        return;
    }
    let userId: string = '';

    try {
        userId = await dbFuns.getUserId(dsn, req.body);
    } catch (e) {
        if (e instanceof UserNotFoundException || e instanceof IncorrectPasswordException) {
            res.json({ error: 'invalid_credentials' });
            return;
        }
        res.json({ error: 'internal_error' });
        return;
    }

    const token: jwt.Secret = jwt.sign(
        {
            username: req.body.username,
            userId: userId
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({ token: token });
});

// only allow users with a valid access token to access list of
// all users
router.get('/list', function(
    req: express.Request,
    res: express.Response,
    next: any
) {
    let token: string;

    if (req.headers['x-access-token'] === undefined) {
        res.json({ authentication_error: 'missing x-access-token header' });
        return;
    } else if (typeof req.headers['x-access-token'] === 'string') {
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
