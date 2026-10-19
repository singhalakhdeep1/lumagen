import { createSchema } from 'graphql-yoga'
import { prisma } from '@/lib/db'
import { generateImage, GenerateRequestSchema } from '@/lib/generation'
import { pubsub } from '@/lib/pubsub'
import type { Provider } from '@prisma/client'

const typeDefs = /* GraphQL */ `
  type Generation {
    id: ID!
    prompt: String!
    style: String!
    aspectRatio: String!
    provider: String!
    status: String!
    imageUrl: String
    errorMessage: String
    createdAt: String!
    completedAt: String
  }

  type DeleteResult {
    success: Boolean!
    message: String
  }

  type Query {
    imageGenerations(limit: Int, offset: Int): [Generation!]!
    generation(id: ID!): Generation
  }

  type Mutation {
    generateImage(prompt: String!, model: String, style: String): Generation!
    deleteGeneration(id: ID!): DeleteResult!
  }

  type Subscription {
    imageGenerated(userId: ID): Generation!
  }
`

export const schema = createSchema({
  typeDefs,
  resolvers: {
    Query: {
      imageGenerations: (_root, args: { limit?: number; offset?: number }) =>
        prisma.generation.findMany({ take: Math.min(100, args.limit ?? 20), skip: args.offset ?? 0, orderBy: { createdAt: 'desc' } }),
      generation: (_root, args: { id: string }) => prisma.generation.findUnique({ where: { id: args.id } }),
    },
    Mutation: {
      generateImage: async (_root, args: { prompt: string; model?: string; style?: string }, context: { ip?: string }) => {
        const input = GenerateRequestSchema.parse({ prompt: args.prompt, style: args.style, provider: (args.model as Provider) ?? undefined })
        const { generation } = await generateImage(input, context.ip)
        return generation
      },
      deleteGeneration: async (_root, args: { id: string }) => {
        try {
          await prisma.generation.delete({ where: { id: args.id } })
          return { success: true, message: 'Deleted' }
        } catch {
          return { success: false, message: 'Not found' }
        }
      },
    },
    Subscription: {
      imageGenerated: {
        subscribe: () => pubsub.subscribe('IMAGE_GENERATED'),
        resolve: (payload: { imageGenerated: unknown }) => payload.imageGenerated,
      },
    },
  },
})
