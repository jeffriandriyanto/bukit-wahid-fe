export const useApi = async <T>(url: string, options: any = {}) => {
  const { token, refreshSession } = useAuth()
  const config = useRuntimeConfig()

  // Gunakan interceptor pola wrapper agar retry benar-benar mengembalikan data ke pemanggil
  const fetcher = $fetch.create({
    baseURL: config.public.baseUrl,
    headers: {
      Accept: 'application/json',
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
      if (url.includes('/login') || url.includes('/refresh-token') || originalOptions._retry) {
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
            return $fetch(url, originalOptions)
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
