import { ApolloServer } from '@apollo/server';
import { unwrapResolverError } from '@apollo/server/errors';
import { expressMiddleware } from '@as-integrations/express5';
import type { RequestHandler } from 'express';
import type { GraphQLFormattedError } from 'graphql';
import { config } from '../config';
import { AppError, toError } from '../utils/errors';
import { logger } from '../utils/logger';
import { resolvers } from './resolvers';
import { typeDefs } from './typeDefs';

function formatError(formatted: GraphQLFormattedError, error: unknown): GraphQLFormattedError {
  const original = toError(unwrapResolverError(error));

  if (original instanceof AppError) {
    logger.error(original.message, {
      errorMessage: original.message,
      errorName: original.name,
      stack: original.stack,
      ...original.context,
    });

    return {
      message: original.message,
      extensions: { code: original.name },
    };
  }

  const { stacktrace: _stacktrace, ...extensions } = formatted.extensions ?? {};
  return { ...formatted, extensions };
}

export async function createGraphqlHandler(): Promise<RequestHandler> {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: !config.isProduction,
    formatError,
  });

  await server.start();
  logger.info('GraphQL schema ready');

  return expressMiddleware(server);
}
