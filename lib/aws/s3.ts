// AWS S3 integration for lumagen (S3_ENDPOINT lets this target any S3-compatible store for local dev/testing).
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

function s3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    ...(endpoint && { endpoint, forcePathStyle: true }),
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  })
}

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'lumagen-images'

export function s3Configured(): boolean {
  return Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.S3_BUCKET_NAME)
}

export async function uploadImage(key: string, imageBuffer: Buffer, contentType: string = 'image/png'): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: imageBuffer,
    ContentType: contentType,
  })

  await s3Client().send(command)
  const endpoint = process.env.S3_ENDPOINT
  return endpoint ? `${endpoint.replace(/\/+$/, '')}/${BUCKET_NAME}/${key}` : `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`
}

export async function getImage(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  const response = await s3Client().send(command)
  const chunks: Uint8Array[] = []

  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }

  return Buffer.concat(chunks)
}

export async function deleteImage(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client().send(command)
}

export function generateImageKey(scope: string, timestamp: number): string {
  return `images/${scope}/${timestamp}-${crypto.randomUUID().slice(0, 8)}.png`
}
