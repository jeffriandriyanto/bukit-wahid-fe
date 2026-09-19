export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  try {
    const response = await $fetch<any>('/login', {
      baseURL: config.public.baseUrl,
      method: 'POST',
      body
    })

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
  } catch (err: any) {
    const errorData = err?.response?._data || err?.data
    throw createError({
      statusCode: err?.statusCode || err?.status || 400,
      statusMessage: errorData?.message || err?.message || 'Gagal login',
      data: errorData
    })
  }
})
