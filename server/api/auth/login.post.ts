export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  const response = await $fetch('/login', {
    baseURL: config.public.baseUrl,
    method: 'POST',
    body
  })

  if (response?.data?.auth?.refresh?.token) {
    setCookie(event, 'refresh_token', response.data.auth.refresh.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })
  }

  return response
})
