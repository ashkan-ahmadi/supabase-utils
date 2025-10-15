// Upstash Rate Limiter
// This Edge Function returns a Lord Of The Rings quote
// There is a 1-per-15-second rate limit using Upstash

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createRateLimiter } from '../_shared/upstash/upstash.ts'
import { createSupabaseAdmin } from '../_shared/supabase/supabase.ts'

const responseHeaders = new Headers()
responseHeaders.set('Content-Type', 'application/json')

Deno.serve(async (req: Request) => {
  // accept GET requests only
  if (req.method !== 'GET') {
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
        status: 401,
        headers: responseHeaders,
      }
    )
  }

  // First get the token from the Authorization header
  // req.headers.get('Authorization').replace('Bearer ', '')
  const token = AuthorizationInHeader.replace('Bearer ', '')

  if (!token) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'No token',
        },
      }),
      {
        status: 401,
        headers: responseHeaders,
      }
    )
  }

  // In this specific case, you can choose to use the client or admin key
  const supabaseAdmin = createSupabaseAdmin()

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

  // You can call this anything you want
  // Make it descriptive
  const action = 'get-lotr-quote'

  // The identifier should be unique per action per user
  // For example, submit-form_@_123 is unique to the user with ID 123
  // The `_@_` separator is nothing unique or special. You can use anything else to creation separation
  const identifier = `${action}_@_${user.id}`

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
        quote: getRandomQuote(),
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

function getRandomQuote(): string {
  const lotrQuotes = ['Even the smallest person can change the course of the future. - Galadriel', 'All we have to decide is what to do with the time that is given us. - Gandalf', "There is some good in this world, and it's worth fighting for. - Samwise Gamgee", 'Not all those who wander are lost. - J.R.R. Tolkien', 'The world is indeed full of peril, and in it there are many dark places; but still there is much that is fair. - Haldir', 'I wish it need not have happened in my time. - Frodo', 'So do I, and so do all who live to see such times. But that is not for them to decide. - Gandalf', 'Deeds will not be less valiant because they are unpraised. - Aragorn', 'Courage is found in unlikely places. - Gildor', 'You shall not pass! - Gandalf', 'The road goes ever on and on. - Bilbo Baggins', 'I am glad you are here with me. Here at the end of all things, Sam. - Frodo', 'A day may come when the courage of men fails, but it is not this day! - Aragorn', 'Even darkness must pass. A new day will come. - Samwise Gamgee', "There's some good in this world, Mr. Frodo, and it's worth fighting for. - Samwise Gamgee", "It's the job that's never started as takes longest to finish. - Samwise Gamgee", 'Faithless is he that says farewell when the road darkens. - Gimli', "I will not say ‘do not weep,' for not all tears are an evil. - Gandalf", 'The board is set, the pieces are moving. - Gandalf', 'The burned hand teaches best. After that, advice about fire goes to the heart. - Gandalf', 'A hunted man sometimes wearies of distrust and longs for friendship. - Aragorn', 'Oft hope is born when all is forlorn. - Legolas', 'It is useless to meet revenge with revenge: it will heal nothing. - Frodo', "You step into the Road, and if you don't keep your feet, there is no knowing where you might be swept off to. - Bilbo Baggins", 'The old that is strong does not wither. - J.R.R. Tolkien', 'I would rather share one lifetime with you than face all the ages of this world alone. - Arwen', 'Even the wise cannot see all ends. - Gandalf', 'War will make corpses of us all. - Faramir', "I can't carry it for you, but I can carry you! - Samwise Gamgee", 'Let him not vow to walk in the dark, who has not seen the nightfall. - Elrond', 'The wide world is all about you: you can fence yourselves in, but you cannot forever fence it out. - Gildor', 'It is not the strength of the body, but the strength of the spirit. - J.R.R. Tolkien', 'Despair is only for those who see the end beyond all doubt. We do not. - Gandalf', 'I will take the Ring, though I do not know the way. - Frodo', 'Many that live deserve death. And some that die deserve life. - Gandalf', "There's no knowing where you might be swept off to. - Bilbo Baggins", 'Go where you must go, and hope! - Gandalf']

  const randomIndex = Math.floor(Math.random() * lotrQuotes.length)
  return lotrQuotes[randomIndex]
}

/* To invoke locally:

  1. Run `supabase start && supabase functions serve --env-file .env`
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/upstash-rate-limiter'

*/
