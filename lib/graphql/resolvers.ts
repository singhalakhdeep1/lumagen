import { createSchema } from 'graphql-yoga'
import { prisma } from '@/lib/db'
import { generateImage, GenerateRequestSchema, RateLimitedError, checkGenerationRateLimit } from '@/lib/generation'
import { configuredProviders } from '@/lib/ai/provider'
import { pubsub } from '@/lib/pubsub'
import { typeDefs } from './schema'

interface GqlContext {
  ip: string
}

export const schema = createSchema<GqlContext>({
  typeDefs,
  resolvers: {
    Query: {
      generation: async (_: unknown, { id }: { id: string }) => {
        return prisma.generation.findUnique({ where: { id } })
      },

      generations: async (_: unknown, args: { limit?: number; offset?: number; status?: string }) => {
        const limit = Math.min(100, args.limit ?? 20)
        const offset = Math.max(0, args.offset ?? 0)
        const where = args.status ? { status: args.status as 'pending' | 'processing' | 'completed' | 'failed' } : undefined
        const [items, total] = await Promise.all([
          prisma.generation.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
          prisma.generation.count({ where }),
        ])
        return { items, total, limit, offset }
      },

      providers: () => configuredProviders(),
    },

    Mutation: {
      generate: async (_: unknown, args: { prompt: string; style?: string; aspectRatio?: string; provider?: string }, ctx: GqlContext) => {
        await checkGenerationRateLimit(ctx.ip)
        const input = GenerateRequestSchema.parse(args)
        const result = await generateImage(input, ctx.ip)
        if (result.generation.status === 'failed') {
          throw new Error(result.generation.errorMessage ?? 'Generation failed')
        }
        return result
      },
    },

    Subscription: {
      imageGenerated: {
        subscribe: () => pubsub.asyncIterator(['IMAGE_GENERATED']),
        resolve: (payload: { imageGenerated: unknown }) => payload.imageGenerated,
      },
    },
  },
})
