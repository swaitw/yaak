import type { GraphQLSchema } from 'graphql';
import { atom } from 'jotai';

export const graphqlSchemaAtom = atom<GraphQLSchema | null>(null);
export const graphqlDocStateAtom = atom<boolean>(false);
