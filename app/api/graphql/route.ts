// GraphQL endpoint (graphql-yoga): queries/mutations/subscriptions from lib/graphql/schema.ts, backed by the same
// generateImage() pipeline the REST routes use (rate limiting, caching, persistence, provider dispatch all shared).
// Subscriptions use Yoga's built-in SSE transport, which works inside a Next.js Route Handler without a separate
// WebSocket server.
import { createYoga } from 'graphql-yoga'
import { schema } from '@/lib/graphql/resolvers'

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
  context: ({ request }) => ({ ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1' }),
})

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS }
