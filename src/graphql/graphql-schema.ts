import { GraphQLSchema } from 'graphql';
import { RootMutationType, RootQueryType } from './graphql-types.js';

export const graphSchema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType
});
