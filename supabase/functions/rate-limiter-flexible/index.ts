// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import * as RateLimiterFlexible from 'npm:rate-limiter-flexible'

// https://www.npmjs.com/package/rate-limiter-flexible
// It uses a fixed window, as it is much faster than a rolling window.

// Within a 2-second window, you can send 1 requests
const points = {
  points: 1,
  duration: 2,
}

const rateLimiter = new RateLimiterFlexible.default.RateLimiterMemory(points)

interface RateLimiterRes {
  msBeforeNext: number // Number of milliseconds before next action can be done
  remainingPoints: number // Number of remaining points in current duration
  consumedPoints: number // Number of consumed points in current duration
  isFirstInDuration: boolean // action is first in current duration
}
Deno.serve(async (request: Request) => {
  try {
    const action = 'submit_form'
    const uniqueIdentifier = 1 // User ID, API key, IP, etc - for a general

    // you can
    await rateLimiter.consume(action, uniqueIdentifier)
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 429,
          message: `Too many requests. Please try again in ${error.msBeforeNext ? Math.ceil(error?.msBeforeNext / 1000) : 'a few'} second(s).`,
        },
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(error.msBeforeNext / 1000),
          'X-RateLimit-Limit': String(points.points),
          'X-RateLimit-Remaining': String(error.remainingPoints),
          'X-RateLimit-Reset': String(Math.ceil((Date.now() + error.msBeforeNext) / 1000)),
        },
      }
    )
  }

  // The rest of your code here ....

  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request GET 'http://127.0.0.1:54321/functions/v1/rate-limiter-flexible' \
    --header 'Content-Type: application/json'

*/
