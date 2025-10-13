// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createRateLimiter } from '../_shared/upstash/upstash.ts'

const responseHeaders = new Headers()
responseHeaders.set('Content-Type', 'application/json')

Deno.serve(async () => {
  // You can
  const action = 'do-some-action'

  // Make sure you get the user's ID
  const user_id = 123

  // The identifier should be unique per action per user
  // For example, submit-form_@_123 is unique to the user with ID 123
  // The `_@_` separator is nothing unique or special. You can use anything else to creation separation
  const identifier = `${action}_@_${user_id}`

  try {
    // Accepts 1 request every 15 seconds.
    // Ensure that different users do not have the same identifier
    // Otherwise, one user would block other users from accessing your resource
    const rateLimitData = await createRateLimiter(1, '15 s', identifier)

    // This means that the request has reached the rate limit
    if (!rateLimitData.success) {
      const now = Date.now()
      const difference = rateLimitData?.reset - now
      let retryAfter = 0 // seconds

      // The reason we do this is to inform the user how much time is left
      if (difference >= 0) {
        // divide by 1000 to convert to seconds, ceil to get rid of decimals and show slightly higher value (better to show 1.4 seconds as 2 seconds than 1 second)
        retryAfter = Math.ceil(difference / 1000)
      }

      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After
      responseHeaders.set('Retry-After', retryAfter.toString())

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: `Too many attempts. Please try again in ${retryAfter ? retryAfter : 'a few'} seconds.`,
          },
        }),
        {
          status: 429, // Too Many Requests
          headers: responseHeaders,
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: responseHeaders,
      }
    )
  } catch (error) {
    console.error(error)

    // this is done to get the type of the error
    // https://stackoverflow.com/questions/54649465/how-to-do-try-catch-and-finally-statements-in-typescript
    const errorMessage = typeof error === 'string' ? error : error instanceof Error ? error.message : ''

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: errorMessage,
        },
      }),
      { headers: responseHeaders }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start && supabase functions serve --env-file .env`
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/upstash-rate-limiter'

*/
