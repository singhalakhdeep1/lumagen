import { createSchema } from 'graphql-yoga'

export const typeDefs = /* GraphQL */ `
  type Generation {
    id: String!
    prompt: String!
    enhancedPrompt: String!
    style: String!
    aspectRatio: String!
    provider: String!
    status: String!
    imageUrl: String
    width: Int
    height: Int
    errorMessage: String
    externalJobId: String
    createdAt: String!
    completedAt: String
  }

  type GenerationResult {
    generation: Generation!
  }

  type GenerationPage {
    items: [Generation!]!
    total: Int!
    limit: Int!
    offset: Int!
  }

  type Query {
    generation(id: String!): Generation
    generations(limit: Int, offset: Int, status: String): GenerationPage!
    providers: [String!]!
  }

  type Mutation {
    generate(
      prompt: String!
      style: String
      aspectRatio: String
      provider: String
    ): GenerationResult!
  }

  type Subscription {
    imageGenerated: Generation!
  }
`
