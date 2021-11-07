import { GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';

import * as dbFuns from '../db/db-functions.js';
import { dsn } from '../../app.js';
import { InvalidIdException } from '../exceptions/InvalidIdException.js';
import { TextDocument } from '../interfaces/TextDocument.js';
import { isValidId } from '../util/util.js';
import { DocumentNotFoundException } from '../exceptions/DocumentNotFoundException.js';
import { NoIdDocument } from '../interfaces/NoIdDocument.js';

const docColName = 'editorDocs';

const TextDocumentType = new GraphQLObjectType({
    name: 'TextDocument',
    description: 'Represents a text document with an owner and possibly multiple other editors.',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLString) },
        title: { type: GraphQLNonNull(GraphQLString) },
        body: { type: GraphQLNonNull(GraphQLString) },
        ownerId: { type: GraphQLNonNull(GraphQLString) },
        editorIds: { type: GraphQLList(GraphQLString) },
        type: { type: GraphQLNonNull(GraphQLString) },
        owner: {
            type: EditorType,
            resolve: async (doc) => {
                return await dbFuns.getSingleEditor(dsn, doc.ownerId);
            }
        },
        editors: {
            type: GraphQLList(EditorType),
            resolve: async (doc) => {
                return await dbFuns.getMultipleEditors(dsn, doc.editorIds);
            }
        }
    })
});

const EditorType = new GraphQLObjectType({
    name: 'DocumentEditor',
    description: 'Represents a text document editor.',
    fields: () => ({
        username: { type: GraphQLNonNull(GraphQLString) },
        id: { type: GraphQLNonNull(GraphQLString) }
    })
});

export const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        document: {
            type: TextDocumentType,
            description: 'A single text document that request user is owner or editor of',
            args: {
                id: { type: GraphQLString }
            },
            resolve: async (parent, args, req) => {
                if (!isValidId(args.id)) {
                    throw new InvalidIdException('Specified document ID is invalid');
                }
                try {
                    const searchResult: TextDocument = await dbFuns.getSingleDocInCollection(
                        dsn,
                        docColName,
                        args.id,
                        req.userId
                    );

                    return searchResult;
                } catch (e) {
                    throw new DocumentNotFoundException(
                        'The document does not exist, or you do not have access to it.'
                    );
                }
            }
        },
        documents: {
            type: new GraphQLList(TextDocumentType),
            description: 'List of all text documents that request user is owner or editor of',
            resolve: async (parent, args, req) => {
                return await dbFuns.getRelatedDocsInCollection(
                    dsn,
                    docColName,
                    req.userId
                );
            }
        },
        editors: {
            type: new GraphQLList(EditorType),
            description: 'List of all editors',
            resolve: async () => {
                return await dbFuns.listEditors(dsn);
            }
        }
    })
});

export const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root Mutation',
    fields: () => ({
        createDocument: {
            type: TextDocumentType,
            description: 'Create new document',
            args: {
                title: { type: GraphQLNonNull(GraphQLString) },
                body: { type: GraphQLNonNull(GraphQLString) },
                ownerId: { type: GraphQLNonNull(GraphQLString) },
                type: { type: GraphQLNonNull(GraphQLString) }
            },
            resolve: async (parent, args) => {
                const newDoc: NoIdDocument = {
                    title: args.title,
                    body: args.body,
                    ownerId: args.ownerId,
                    editorIds: [],
                    type: args.type
                };
                const generatedDocId: string = await dbFuns.sendDocToCollection(
                    dsn, docColName, newDoc
                );

                const returnDoc: TextDocument = {
                    id: generatedDocId,
                    ...newDoc
                };

                return returnDoc;
            }
        },
        updateDocument: {
            type: TextDocumentType,
            description: 'Update a document',
            args: {
                id: { type: GraphQLNonNull(GraphQLString) },
                title: { type: GraphQLNonNull(GraphQLString) },
                body: { type: GraphQLNonNull(GraphQLString) },
                ownerId: { type: GraphQLNonNull(GraphQLString) },
                editorIds: { type: GraphQLList(GraphQLString) }
            },
            resolve: async (parent, args) => {
                if (!isValidId(args.id)) {
                    throw new InvalidIdException('Specified document ID is invalid');
                }
                const updatedDoc: TextDocument = {
                    id: args.id,
                    title: args.title,
                    body: args.body,
                    ownerId: args.ownerId,
                    editorIds: args.editorIds,
                    type: args.type
                };

                try {
                    await dbFuns.updateSingleDocInCollection(
                        dsn, docColName, updatedDoc
                    );
                } catch (e) {
                    if (e instanceof DocumentNotFoundException) {
                        throw new DocumentNotFoundException('Document with matching ID not found.');
                    } else {
                        throw e;
                    }
                }

                return updatedDoc;
            }
        }
    })
});
