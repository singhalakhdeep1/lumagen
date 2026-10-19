// GraphQL client setup for lumagen. Talks to this app's own /api/graphql by default (NEXT_PUBLIC_GRAPHQL_HTTP_URL
// lets it point elsewhere). Subscriptions use Yoga's SSE transport over the same HTTP endpoint (no separate WS
// server needed), so no graphql-ws link is wired unless NEXT_PUBLIC_GRAPHQL_WS_URL is explicitly set.

import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL || '/api/graphql',
})

const wsUrl = process.env.NEXT_PUBLIC_GRAPHQL_WS_URL
const wsLink = typeof window !== 'undefined' && wsUrl ? new GraphQLWsLink(createClient({ url: wsUrl })) : null

const splitLink = wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query)
        return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
      },
      wsLink,
      httpLink,
    )
  : httpLink

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})
