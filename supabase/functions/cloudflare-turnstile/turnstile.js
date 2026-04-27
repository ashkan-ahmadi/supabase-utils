function setFormDisabledState(form, isDisabled) {
  for (let i = 0; i < form.elements.length; i++) {
    form.elements[i].disabled = isDisabled
  }
}

const headers = new Headers()
headers.set('Content-Type', 'application/json')

const form = document.querySelector('#form')

form?.addEventListener('submit', async e => {
  e.preventDefault()

  const formData = new FormData(form)
  const fields = Object.fromEntries(formData)

  // disable after getting fields
  setFormDisabledState(form, true)

  // This isn't on the html file but it is injected by cloudflare library
  const cfToken = fields['cf-turnstile-response']

  if (!cfToken) return

  try {
    // Update this to your own endpoint
    const serverURL = 'http://localhost:54321/functions/v1/cloudflare-turnstile'

    const response = await fetch(serverURL, {
      method: 'POST', // Endpoint accepts POST request only
      body: JSON.stringify({
        token: cfToken,
      }),
      headers: headers,
    })

    const { success } = await response.json()

    if (success) {
      alert('Success :)')
    } else {
      alert('Failed :( Check out Console for more info')
      console.error(error)
    }
  } catch (error) {
    console.error(error)
  } finally {
    setFormDisabledState(form, false)
  }
})
