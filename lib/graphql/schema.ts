// GraphQL schema for lumagen

import { gql } from '@apollo/client';

export const GET_IMAGE_GENERATIONS = gql`
  query GetImageGenerations($limit: Int, $offset: Int) {
    imageGenerations(limit: $limit, offset: $offset) {
      id
      prompt
      model
      style
      imageUrl
      createdAt
      userId
    }
  }
`;

export const GET_GENERATION = gql`
  query GetGeneration($id: ID!) {
    generation(id: $id) {
      id
      prompt
      model
      style
      imageUrl
      createdAt
      userId
    }
  }
`;

export const GENERATE_IMAGE = gql`
  mutation GenerateImage($prompt: String!, $model: String!, $style: String) {
    generateImage(prompt: $prompt, model: $model, style: $style) {
      id
      prompt
      model
      style
      imageUrl
      createdAt
    }
  }
`;

export const DELETE_GENERATION = gql`
  mutation DeleteGeneration($id: ID!) {
    deleteGeneration(id: $id) {
      success
      message
    }
  }
`;

export const IMAGE_GENERATION_SUBSCRIPTION = gql`
  subscription OnImageGenerated($userId: ID!) {
    imageGenerated(userId: $userId) {
      id
      prompt
      model
      style
      imageUrl
      createdAt
    }
  }
`;
