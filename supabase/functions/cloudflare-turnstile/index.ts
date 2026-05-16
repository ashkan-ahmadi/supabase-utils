// https://supabase.com/docs/guides/functions/examples/cloudflare-turnstile
// https://developers.cloudflare.com/turnstile/

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// import { corsHeaders } from '../_shared/supabase/supabase.ts'
import { corsHeaders } from 'npm:@supabase/supabase-js/cors' // v2.95.0+

import { getUserIP } from '../_shared/utils.ts'

import { validateTurnstile } from '../_shared/cloudflare/turnstile.ts'

interface BodyReq {
  token: string
}

Deno.serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // This is needed if you're planning to invoke your function from a browser.
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Invalid HTTP Method. Only POST request allowed.',
        },
      })
    )
  }

  const { token }: BodyReq = await req.json()

  if (!token) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Missing required token',
        },
      }),
      { headers: corsHeaders, status: 400 }
    )
  }

  const ip = getUserIP(req)

  if (!ip) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Could not access IP',
        },
      }),
      { headers: corsHeaders, status: 400 }
    )
  }

  const turnstileValidation = await validateTurnstile(token, ip)

  if (!turnstileValidation.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: turnstileValidation.error?.message || 'Could not validate token',
          error_codes: turnstileValidation['error-codes'],
        },
      }),
      { headers: corsHeaders }
    )
  }

  return new Response(
    JSON.stringify({
      success: true,
    }),
    { headers: corsHeaders }
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/cloudflare-turnstile' \
    --header 'Content-Type: application/json' \
    --data '{"token":"token_123456"}'

*/
