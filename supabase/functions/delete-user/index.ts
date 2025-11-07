/**
 * Delete user:
 *
 * This Edge Function receives a token and if all validations go well, anonymizes the account's personal information.
 *
 * Supabase completely anonymizes the auth.users.email value (e.g. a@b.c becomes 8bFfI6LgdnyuYuhZ86uUokqB3KZeYeZt7GGQgosvDxU)
 * It also deletes the user's password and session.
 *
 * Official doc:
 * https://supabase.com/docs/reference/javascript/auth-admin-deleteuser
 *
 */

import { createSupabaseAdmin } from '../_shared/supabase/supabase.ts'
import { createRateLimiter } from '../_shared/upstash/upstash.ts'

const responseHeaders = new Headers()
responseHeaders.set('Content-Type', 'application/json')

Deno.serve(async (req: Request) => {
  try {
    // accept DELETE requests only
    if (req.method !== 'DELETE') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Method Not Allowed',
          },
        }),
        {
          status: 405,
          headers: responseHeaders,
        }
      )
    }

    // Check if the Authorization exists in the Headers
    const AuthorizationInHeader = req.headers.get('Authorization')

    if (!AuthorizationInHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Missing Authorization',
          },
        }),
        {
          status: 400,
          headers: responseHeaders,
        }
      )
    }

    // Check if the Bearer token exists as the value of Authorization
    const token = AuthorizationInHeader.replace('Bearer ', '')

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Missing token',
          },
        }),
        {
          status: 400,
          headers: responseHeaders,
        }
      )
    }

    // We need Admin level to remove the user
    const supabaseAdmin = createSupabaseAdmin()

    // Get the user based on their token
    // This is preferred to sending their user ID
    const {
      data: { user },
      error: errorGetUser,
    } = await supabaseAdmin.auth.getUser(token)

    if (!user || errorGetUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: errorGetUser,
          user: user,
        }),
        {
          status: 401,
          headers: responseHeaders,
        }
      )
    }

    // This means that until here, the request has come from a valid authenticated user

    // START RATE LIMITING: delete this part if you dont want rate limiting per user

    // You can call this anything you want
    // Make it descriptive (it's shared between paid and free functions)

    const action = 'delete-user'

    //
    const rateLimitLimit = 1
    const rateLimitWindow = '1 s'
    // The identifier should be unique per action per user
    // For example, submit-form_@_123 is unique to the user with ID 123
    // The `_@_` separator is nothing unique or special. You can use anything else to creation separation
    const identifier = `${action}_@_${user.id}`

    // Accepts 1 request every 15 seconds.
    // Ensure that different users do not have the same identifier
    // Otherwise, one user would block other users from accessing your resource
    const rateLimitData = await createRateLimiter(rateLimitLimit, rateLimitWindow, identifier)

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

      responseHeaders.set('X-RateLimit-Limit', rateLimitData.limit.toString())
      responseHeaders.set('X-RateLimit-Reset', rateLimitData.reset.toString())
      responseHeaders.set('X-RateLimit-Remaining', rateLimitData.remaining.toString())

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

    // END RATE LIMITING

    // This part is optional depending on whether you store any PII (Personal Identifiable Information) in a table or no. If you have any PII like name, address, date of birth, profile photo, etc you have to anonymize them.
    const { error: errorUpdateProfile } = await supabaseAdmin
      .from('profiles')
      .update({
        first_name: '(deleted)',
        last_name: '(deleted)',
        avatar_url: '(deleted)',
      })
      .eq('id', user.id)

    if (errorUpdateProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'There was a problem updating your profile. Please try again. If the issue persits, please contact us.',
          },
        }),
        {
          status: 500,
          headers: responseHeaders,
        }
      )
    }

    // softDelete: true -> anonymize, false: delete completely all related data
    // Suggested: keep as true to anonymize
    // This ensures the data is NOT deleted entirely
    // This completely randomizes the auth.users.email value and removes the hashed password completely
    // The user can create another account using the same email in the future but it will be a totally new account. They can never get their original deleted account back
    const softDelete = true

    const { error: errorDeleteUser } = await supabaseAdmin.auth.admin.deleteUser(user.id, softDelete)

    if (errorDeleteUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'There was a problem updating your profile. Please try again. If the issue persits, please contact us.',
          },
        }),
        {
          status: 400,
          headers: responseHeaders,
        }
      )
    }

    // If we reach here, it means everything must have gone fine
    return new Response(
      JSON.stringify({
        success: true, // If you show any confirmation, use this in your psot-request check
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

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request DELETE 'http://127.0.0.1:54321/functions/v1/delete-user' \
    --header 'Authorization: Bearer ACCESS_CODE'

*/
