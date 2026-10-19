/**
 * Cache Service for Lumagen
 * Implements distributed caching with Redis for image generation platform data (in-process fallback without Redis).
 */
import { getRedis } from '@/lib/redis'

const memory = new Map<string, { value: string; expires: number }>()

export class CacheService {
  private defaultTTL = 3600

  async get(key: string): Promise<string | null> {
    const redis = getRedis()
    if (redis) {
      try {
        return await redis.get(key)
      } catch {
        return null
      }
    }
    const hit = memory.get(key)
    if (!hit) return null
    if (hit.expires < Date.now()) {
      memory.delete(key)
      return null
    }
    return hit.value
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const expiration = ttl ?? this.defaultTTL
    const redis = getRedis()
    if (redis) {
      await redis.setex(key, expiration, value).catch(() => undefined)
      return
    }
    memory.set(key, { value, expires: Date.now() + expiration * 1000 })
  }

  /** Sets only if the key does not exist; returns true when this call claimed it. */
  async setIfAbsent(key: string, value: string, ttl: number): Promise<boolean> {
    const redis = getRedis()
    if (redis) {
      try {
        return (await redis.set(key, value, 'EX', ttl, 'NX')) === 'OK'
      } catch {
        return true
      }
    }
    if ((await this.get(key)) !== null) return false
    await this.set(key, value, ttl)
    return true
  }

  async delete(key: string): Promise<void> {
    const redis = getRedis()
    if (redis) {
      await redis.del(key).catch(() => undefined)
      return
    }
    memory.delete(key)
  }

  async getOrSet(key: string, factory: () => Promise<string>, ttl?: number): Promise<string> {
    const cachedValue = await this.get(key)
    if (cachedValue !== null) return cachedValue
    const value = await factory()
    await this.set(key, value, ttl)
    return value
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const redis = getRedis()
    if (redis) {
      let cursor = '0'
      do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200)
        cursor = next
        if (keys.length) await redis.del(...keys)
      } while (cursor !== '0')
      return
    }
    const re = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
    for (const key of memory.keys()) if (re.test(key)) memory.delete(key)
  }

  async clearAll(): Promise<void> {
    await this.invalidatePattern('*')
  }
}

export const cache = new CacheService()
