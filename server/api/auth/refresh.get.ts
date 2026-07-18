export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'refresh_token')

  if (!refreshToken) {
    throw createError({ statusCode: 401, message: 'No refresh token' })
  }

  const config = useRuntimeConfig()

  const response = await $fetch('/refresh-token', {
    baseURL: config.public.baseUrl,
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + refreshToken
    }
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
