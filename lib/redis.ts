// Shared Redis connection (optional: cache and rate limiting fall back to in-process state without it).
import { Redis } from 'ioredis'

let client: Redis | null | undefined

export function redisUrl(): string | undefined {
  if (process.env.REDIS_URL) return process.env.REDIS_URL
  if (process.env.REDIS_HOST) return `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT ?? '6379'}`
  return undefined
}

export function getRedis(): Redis | null {
  if (client !== undefined) return client
  const url = redisUrl()
  if (!url) {
    client = null
    return client
  }
  client = new Redis(url, { maxRetriesPerRequest: 2, retryStrategy: (n) => Math.min(n * 200, 3000) })
  client.on('error', () => undefined)
  return client
}
