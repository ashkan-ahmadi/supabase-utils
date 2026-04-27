// import { corsHeaders } from '../supabase/supabase.ts'
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

export async function validateTurnstile(token: string, remoteip: string): Promise<Response> {
  const CLOUDFLARE_SECRET_KEY: string = Deno.env.get('CLOUDFLARE_SECRET_KEY')! ?? ''

  if (!CLOUDFLARE_SECRET_KEY) {
    return {
      success: false,
      error: {
        message: 'Internal issue: missing Cloudflare secret key',
      },
    }
  }

  const idempotencyKey = crypto.randomUUID()

  const formData = new FormData()
  formData.append('secret', CLOUDFLARE_SECRET_KEY)
  formData.append('response', token)
  formData.append('remoteip', remoteip)
  formData.append('idempotency_key', idempotencyKey) // optional

  try {
    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    const result: SuccessfulResponse | FailedResponse = await response.json()

    return result
  } catch (error) {
    console.error('Turnstile validation error:', error)
    return { success: false, error: { message: 'There was a problem validating the token' } }
  }
}

type NoSecretKeyResponse = {
  success: false
  error: {
    message: string
  }
}

type SuccessfulResponse = {
  success: true
  challenge_ts: string
  hostname: string
  action: string
  cdata: string
  metadata: {
    ephemeral_id: string
  }
}

type FailedResponse = {
  success: false
  'error-codes': ['missing-input-secret', 'invalid-input-secret', 'missing-input-response', 'invalid-input-response', 'bad-request', 'timeout-or-duplicate', 'internal-error']
}

type Response = NoSecretKeyResponse | SuccessfulResponse | FailedResponse
