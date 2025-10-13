import { Redis } from 'npm:@upstash/redis'
import { Ratelimit } from 'https://cdn.skypack.dev/@upstash/ratelimit@latest'

export function createRedis() {
  const url = Deno.env.get('UPSTASH_REDIS_REST_URL') || ''
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || ''

  if (!url || !token) {
    throw new Error('Redis url OR token could not be found.')
  }
  return new Redis({
    url,
    token,
  })
}

export async function createRateLimiter(attempts: number, duration: string, identifier: string, opts: UpstashRateLimitOptions = {}): Promise<UpstashRateLimitResponse> {
  // Create a new Redis ratelimiter
  const redis = createRedis()

  const defaultOpts = {
    analytics: true,
    /**
     * Optional prefix for the keys used in redis. This is useful if you want to share a redis
     * instance with other applications and want to avoid key collisions. The default prefix is
     * "@upstash/ratelimit"
     * Override it by passing an object as the 4th param
     */
    prefix: '@upstash/ratelimit',
  }

  const options: UpstashRateLimitOptions = { ...defaultOpts, ...opts }

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      attempts, // how many times you can do something
      duration // in given time frame
    ),
    ...options,
  })

  const upstashRateLimit: UpstashRateLimitResponse = await ratelimit.limit(identifier)

  return upstashRateLimit
}

interface UpstashRateLimitResponse {
  success: boolean
  limit: number
  remaining: number
  reset: number
  pending: object
}

interface UpstashRateLimitOptions {
  analytics?: boolean
  prefix?: string
}
