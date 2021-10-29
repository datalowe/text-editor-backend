'use strict';
import * as dbFuns from '../src/db/db-functions.js';
import express from 'express';
import { TextDocument } from '../src/interfaces/TextDocument.js';
import { dsn } from '../app.js';
import jwt from 'jsonwebtoken';
import * as docRel from '../src/util/auth_util/doc-relationships.js';
import { graphqlHTTP } from 'express-graphql';
import { graphSchema } from '../src/graphql/graphql-schema.js';
import { UserIdRequest } from '../src/interfaces/UserIdRequest.js';
import { DocumentNotFoundException } from '../src/exceptions/DocumentNotFoundException.js';
import { isValidEmail, isValidId, textDocToPDFTemplate } from '../src/util/util.js';
import { create as pdfCreate } from 'html-pdf';
import { sendDocRegistrationInviteMail } from '../src/email/email-functions.js';

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

router.get('/document/:id/pdf', async function(
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

        pdfCreate(textDocToPDFTemplate(searchResult)).toStream(
            (err: any, stream: any) => {
                if (err) {
                    return res.end(err.stack);
                }
                res.setHeader('Content-type', 'application/pdf');
                stream.pipe(res);
            }
        );
    } catch (e) {
        if (e instanceof DocumentNotFoundException) {
            res.json({ error: 'matching_document_not_found' });
            return;
        }
        res.json({ error: 'internal_error' });
    }
});

router.post('/document/:id/invite-editor', async function(
    req: UserIdRequest,
    res: express.Response
) {
    if (!isValidId(req.params.id)) {
        res.json({ error: 'invalid_id' });
        return;
    }
    if (!req.body.invitee_email || !isValidEmail(req.body.invitee_email)) {
        res.json({ error: 'missing_or_invalid_email' });
        return;
    }

    const inviteeEmail: string = req.body.invitee_email;
    const inviterUsername: string = docRel.extractUsername(req);
    const registrationUrl: string = process.env.FRONTEND_REGISTRATION_URL;

    try {
        const searchResult: TextDocument = await dbFuns.getSingleDocInCollection(
            dsn,
            colName,
            req.params.id,
            req.userId
        );

        const docAccessKey: string = jwt.sign(
            {
                inviterId: req.userId,
                inviteeEmail: inviteeEmail,
                docId: req.params.id
            },
            process.env.DOC_INVITE_SECRET,
            { expiresIn: '7d' }
        );

        sendDocRegistrationInviteMail(
            inviteeEmail,
            inviterUsername,
            searchResult.title,
            registrationUrl,
            docAccessKey
        ).then(() => {
            res.json({ success: 'invitation_emailed' });
        }).catch((e) => {
            console.log(e);
            res.json({ error: 'email_failed_reason_unknown' });
        });
    } catch (e) {
        if (e instanceof DocumentNotFoundException) {
            res.json({ error: 'matching_document_not_found' });
            return;
        }
        res.json({ error: 'internal_error' });
    }
});

export const editorRouter = router;
