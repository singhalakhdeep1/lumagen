// In-memory pub/sub for GraphQL subscriptions (single-process; fine for local/dev deployment of this app).
import { createPubSub } from 'graphql-yoga'
import type { Generation } from '@prisma/client'

export type PubSubEvents = {
  IMAGE_GENERATED: [payload: { imageGenerated: Generation }]
}

export const pubsub = createPubSub<PubSubEvents>()
