import { TextDocument } from '../interfaces/TextDocument.js';
import { getSingleDocInCollection } from '../db-functions.js';
import { dsn } from '../../app.js';
import mongodb from 'mongodb';
import express from 'express';
import jwt from 'jsonwebtoken';

const docColName: string = 'editorDocs';

export async function isDocumentOwner(
    userId: string,
    doc: TextDocument,
    dbCheck: boolean = true
): Promise<boolean> {
    if (doc.ownerId !== userId) {
        return false;
    }

    if (dbCheck) {
        const dbDoc: mongodb.Document = await getSingleDocInCollection(
            dsn,
            docColName,
            doc._id,
            userId
        );

        if (userId !== dbDoc.ownerId) {
            return false;
        }
    }

    return true;
}

export async function isDocumentEditor(
    userId: string,
    doc: TextDocument,
    dbCheck: boolean = true
): Promise<boolean> {
    if (!(userId in doc.editorIds)) {
        return false;
    }

    if (dbCheck) {
        const dbDoc: mongodb.Document = await getSingleDocInCollection(
            dsn,
            docColName,
            doc._id,
            userId
        );

        if (!(userId in dbDoc.editors)) {
            return false;
        }
    }

    return true;
}

export async function hasDocumentAccess(
    userId: string,
    doc: TextDocument,
    dbCheck: boolean = true
): Promise<boolean> {
    const isOwner: boolean = await isDocumentOwner(userId, doc, dbCheck);
    const isEditor: boolean = await isDocumentEditor(userId, doc, dbCheck);

    return isOwner || isEditor;
}

export function extractToken(
    req: express.Request
) {
    let token: string;

    if (typeof req.headers['x-access-token'] === 'string') {
        token = req.headers['x-access-token'];
    } else {
        token = req.headers['x-access-token'][0];
    }

    return token;
}

export function extractUsername(
    req: express.Request
): string {
    let token: string;

    if (typeof req.headers['x-access-token'] === 'string') {
        token = req.headers['x-access-token'];
    } else {
        token = req.headers['x-access-token'][0];
    }

    const decodedToken = jwt.decode(token, { json: true });

    return decodedToken.username;
}

export function extractUserId(
    req: express.Request
): string {
    let token: string;

    if (typeof req.headers['x-access-token'] === 'string') {
        token = req.headers['x-access-token'];
    } else {
        token = req.headers['x-access-token'][0];
    }

    const decodedToken = jwt.decode(token, { json: true });

    return decodedToken.userId;
}
