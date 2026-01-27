export const useApi = async <T>(url: string, options: any = {}) => {
  const { token, refreshSession } = useAuth()
  const config = useRuntimeConfig()

  const fetcher = $fetch.create({
    baseURL: config.public.baseUrl,
    headers: {
      Accept: 'application/json'
    },
    onRequest({ options }) {
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`
        }
      }
    },
    async onResponseError({ response, options: originalOptions }) {
      const isAuthAction =
        url.includes('/login') ||
        url.includes('/refresh-token') ||
        url.includes('/logout')

      if (isAuthAction || originalOptions._retry) {
        throw response._data
      }

      if (response.status === 401) {
        originalOptions._retry = true

        try {
          const newToken = await refreshSession()

          if (newToken) {
            originalOptions.headers = {
              ...originalOptions.headers,
              Authorization: `Bearer ${newToken}`
            }
            return fetcher(url, originalOptions)
          }
        } catch (refreshError) {
          throw refreshError
        }
      }

      throw response._data
    }
  })

  return fetcher<T>(url, options)
}
