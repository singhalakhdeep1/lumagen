import { createYoga } from 'graphql-yoga'
import { schema } from '@/lib/graphql/resolvers'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
  context: ({ request }) => ({ ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1' }),
})

export async function GET(request: NextRequest) {
  return yoga.handleRequest(request, {})
}

export async function POST(request: NextRequest) {
  return yoga.handleRequest(request, {})
}

export async function OPTIONS(request: NextRequest) {
  return yoga.handleRequest(request, {})
}
