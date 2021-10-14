import { GraphQLSchema } from 'graphql';
import { RootQueryType } from './graphql-types.js';

export const graphSchema = new GraphQLSchema({
    query: RootQueryType
});
