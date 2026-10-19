/**
 * Rate Limiting Service for Lumagen: token bucket per key.
 * On Redis the refill-and-take step is one Lua script (atomic across concurrent requests and instances).
 * Without Redis an in-process bucket is used; a Redis failure allows the request through rather than blocking users.
 */
import { getRedis } from '@/lib/redis'

const LUA = `
local cap = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])
local d = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(d[1])
local ts = tonumber(d[2])
if tokens == nil then tokens = cap; ts = now end
tokens = math.min(cap, tokens + math.max(0, (now - ts) / 1000) * rate)
local allowed = 0
if tokens >= cost then tokens = tokens - cost; allowed = 1 end
redis.call('HSET', KEYS[1], 'tokens', tostring(tokens), 'ts', tostring(now))
redis.call('EXPIRE', KEYS[1], math.ceil(cap / rate) + 60)
return { allowed, tostring(tokens) }
`

const memory = new Map<string, { tokens: number; ts: number }>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter: number
}

export class RateLimitingService {
  constructor(
    private readonly bucketCapacity = 20,
    private readonly refillRate = 20 / 60, // tokens per second: 20 per minute by default
    private readonly prefix = 'rate_limit',
  ) {}

  async consume(key: string, cost = 1): Promise<RateLimitResult> {
    const now = Date.now()
    const cap = this.bucketCapacity
    const rate = this.refillRate
    const redisKey = `${this.prefix}:${key}`
    const redis = getRedis()
    if (redis) {
      try {
        const [allowed, tokens] = (await redis.eval(LUA, 1, redisKey, cap, rate, now, cost)) as [number, string]
        const left = parseFloat(tokens)
        return { allowed: allowed === 1, remaining: Math.floor(left), retryAfter: allowed === 1 ? 0 : Math.ceil((cost - left) / rate) }
      } catch {
        return { allowed: true, remaining: cap, retryAfter: 0 }
      }
    }
    const b = memory.get(redisKey) ?? { tokens: cap, ts: now }
    b.tokens = Math.min(cap, b.tokens + Math.max(0, (now - b.ts) / 1000) * rate)
    b.ts = now
    const allowed = b.tokens >= cost
    if (allowed) b.tokens -= cost
    memory.set(redisKey, b)
    return { allowed, remaining: Math.floor(b.tokens), retryAfter: allowed ? 0 : Math.ceil((cost - b.tokens) / rate) }
  }

  async isAllowed(key: string, tokensRequested = 1): Promise<boolean> {
    return (await this.consume(key, tokensRequested)).allowed
  }

  async resetBucket(key: string): Promise<void> {
    memory.delete(`${this.prefix}:${key}`)
    await getRedis()?.del(`${this.prefix}:${key}`).catch(() => undefined)
  }
}

/** Per-IP limit on generation (the app has no accounts): 20 generations / 15 minutes, 60 upscales / 15 minutes. */
export const generationLimiter = new RateLimitingService(20, 20 / 900, 'rl:generate')
export const upscaleLimiter = new RateLimitingService(60, 60 / 900, 'rl:upscale')
export const apiLimiter = new RateLimitingService(300, 300 / 60, 'rl:api')
