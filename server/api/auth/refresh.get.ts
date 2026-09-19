export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'refresh_token')

  if (!refreshToken) {
    throw createError({ statusCode: 401, message: 'No refresh token' })
  }

  const config = useRuntimeConfig()

  let response
  try {
    response = await $fetch('/refresh-token', {
      baseURL: config.public.baseUrl,
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + refreshToken
      },
      timeout: 15000,
      retry: 2,
      retryDelay: 1000
    })
  } catch (err: any) {
    const isTimeout = err?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' || err?.message?.includes('timeout')
    throw createError({
      statusCode: isTimeout ? 504 : 502,
      message: isTimeout ? 'API server timeout, coba lagi nanti' : 'Gagal menghubungi API server'
    })
  }

  if (response?.data?.auth?.refresh?.token) {
    const isHttps = event.node.req.headers['x-forwarded-proto'] === 'https' || (process.env.NODE_ENV === 'production' && !event.node.req.headers.host?.includes('localhost') && !event.node.req.headers.host?.includes('127.0.0.1'))
    setCookie(event, 'refresh_token', response.data.auth.refresh.token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    })
  }

  return response
})
