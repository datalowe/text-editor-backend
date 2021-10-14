import { GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
// import { TextDocument } from '../interfaces/TextDocument.js';

import * as dbFuns from '../db-functions.js';
import { dsn } from '../../app.js';
import { InvalidIdException } from '../exceptions/InvalidIdException.js';
import { TextDocument } from '../interfaces/TextDocument.js';
import { isValidId } from '../util/util.js';
import { DocumentNotFoundException } from '../exceptions/DocumentNotFoundException.js';

const docColName = 'editorDocs';

const TextDocumentType = new GraphQLObjectType({
    name: 'TextDocument',
    description: 'Represents a text document with an owner and possibly multiple other editors.',
    fields: () => ({
        _id: { type: GraphQLNonNull(GraphQLString) },
        title: { type: GraphQLNonNull(GraphQLString) },
        body: { type: GraphQLNonNull(GraphQLString) },
        ownerId: { type: GraphQLNonNull(GraphQLString) },
        editorIds: { type: GraphQLList(GraphQLString) },
        owner: {
            type: EditorType,
            resolve: async (doc) => {
                const username = await dbFuns.getSingleUsername(dsn, doc.ownerId);

                return { username: username };
            }
        },
        editors: {
            type: GraphQLList(EditorType),
            resolve: async (doc) => {
                const usernames: string[] = await dbFuns.getMultipleUsernames(dsn, doc.editorIds);

                return usernames.map(u => { return { username: u }; });
            }
        }
    })
});

const EditorType = new GraphQLObjectType({
    name: 'DocumentEditor',
    description: 'Represents a text document editor.',
    fields: () => ({
        username: { type: GraphQLNonNull(GraphQLString) }
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
                return await dbFuns.listUsernames(dsn);
            }
        }
    })
});
