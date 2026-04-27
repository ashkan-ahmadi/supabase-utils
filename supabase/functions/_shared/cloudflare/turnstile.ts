// import { corsHeaders } from '../supabase/supabase.ts'
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

interface CloudflareTurnstileResponse {
  success: boolean
  messages: []
  'error-codes': string[]
}

interface NoKey {
  success: false
  error: {
    message: string
  }
}

interface Catch {
  success: false
  'error-codes': string[]
}

export async function validateTurnstile(token: string, remoteip: string) {
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
  formData.append('idempotency_key', idempotencyKey)

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const result: CloudflareTurnstileResponse = await response.json()

    return result
  } catch (error) {
    console.error('Turnstile validation error:', error)
    return { success: false, 'error-codes': ['internal-error'] }
  }
}
