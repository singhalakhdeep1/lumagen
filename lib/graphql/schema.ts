// GraphQL operations for the Apollo Client (lib/graphql/client.ts). Mirrors the schema served by
// app/api/graphql/route.ts (lib/graphql/resolvers.ts).

import { gql } from '@apollo/client'

export const GET_IMAGE_GENERATIONS = gql`
  query GetImageGenerations($limit: Int, $offset: Int) {
    imageGenerations(limit: $limit, offset: $offset) {
      id
      prompt
      provider
      style
      imageUrl
      status
      createdAt
    }
  }
`

export const GET_GENERATION = gql`
  query GetGeneration($id: ID!) {
    generation(id: $id) {
      id
      prompt
      provider
      style
      imageUrl
      status
      createdAt
    }
  }
`

export const GENERATE_IMAGE = gql`
  mutation GenerateImage($prompt: String!, $model: String!, $style: String) {
    generateImage(prompt: $prompt, model: $model, style: $style) {
      id
      prompt
      provider
      style
      imageUrl
      status
      createdAt
    }
  }
`

export const DELETE_GENERATION = gql`
  mutation DeleteGeneration($id: ID!) {
    deleteGeneration(id: $id) {
      success
      message
    }
  }
`

export const IMAGE_GENERATION_SUBSCRIPTION = gql`
  subscription OnImageGenerated($userId: ID) {
    imageGenerated(userId: $userId) {
      id
      prompt
      provider
      style
      imageUrl
      status
      createdAt
    }
  }
`
