export default defineEventHandler(async (event) => {
  const body = await readBodySafe(event)
  const config = useRuntimeConfig()

  try {
    const response = await $fetch<any>('/login', {
      baseURL: config.public.baseUrl,
      method: 'POST',
      body: body as Record<string, any>
    })

    if (response?.data?.auth?.refresh?.token) {
      const hostHeader = getRequestHeaderSafe(event, 'host') || ''
      const protoHeader = getRequestHeaderSafe(event, 'x-forwarded-proto') || ''
      const isHttps = protoHeader === 'https' || (process.env.NODE_ENV === 'production' && !hostHeader.includes('localhost') && !hostHeader.includes('127.0.0.1'))

      setCookieSafe(event, 'refresh_token', response.data.auth.refresh.token, {
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
