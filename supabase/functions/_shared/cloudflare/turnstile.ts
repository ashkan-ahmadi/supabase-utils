// import { corsHeaders } from '../supabase/supabase.ts'
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

export async function validateTurnstile(token: string, remoteip?: string): Promise<TurnstileValidationResult> {
  const secret = Deno.env.get('CLOUDFLARE_SECRET_KEY') ?? ''

  if (!secret) {
    return {
      success: false,
      'error-codes': ['internal-error'],
      error: {
        message: 'Internal issue: missing Cloudflare secret key',
      },
    }
  }

  const formData = new FormData()
  formData.append('secret', secret)
  formData.append('response', token)
  formData.append('idempotency_key', crypto.randomUUID())

  if (remoteip) {
    formData.append('remoteip', remoteip)
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const result = (await response.json()) as TurnstileSiteverifyResponse

    return result
  } catch (error) {
    console.error('Turnstile validation error:', error)

    return {
      success: false,
      'error-codes': ['internal-error'],
      error: {
        message: 'There was a problem validating the token',
      },
    }
  }
}

type TurnstileErrorCode = 'missing-input-secret' | 'invalid-input-secret' | 'missing-input-response' | 'invalid-input-response' | 'bad-request' | 'timeout-or-duplicate' | 'internal-error'

type TurnstileSuccessResponse = {
  success: true
  challenge_ts: string
  hostname: string

  // Present if you configured these on the client.
  action?: string
  cdata?: string

  // Cloudflare shows this may be present, and ephemeral_id is Enterprise-only.
  metadata?: {
    ephemeral_id?: string
  }

  // Cloudflare's success example includes an empty array, so allow it.
  'error-codes'?: []
}

type TurnstileFailedResponse = {
  success: false
  'error-codes': TurnstileErrorCode[]
}

type LocalTurnstileFailedResponse = TurnstileFailedResponse & {
  error?: {
    message: string
  }
}

type TurnstileSiteverifyResponse = TurnstileSuccessResponse | TurnstileFailedResponse

type TurnstileValidationResult = TurnstileSuccessResponse | LocalTurnstileFailedResponse
