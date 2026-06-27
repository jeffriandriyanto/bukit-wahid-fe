import type { ApiResponse } from '~/types/api'

let _fetcher: ReturnType<typeof $fetch.create> | null = null

function getFetcher() {
  if (_fetcher) return _fetcher

  const config = useRuntimeConfig()

  _fetcher = $fetch.create({
    baseURL: config.public.baseUrl,
    headers: {
      Accept: 'application/json'
    },
    onRequest({ options }) {
      const { token } = useAuth()
      if (token.value) {
        options.headers = {
          ...options.headers as any,
          Authorization: 'Bearer ' + token.value
        }
      }
    },
    async onResponse({ response, options }) {
      const data = response._data
      if (
        data &&
        typeof data === 'object' &&
        data.status !== undefined &&
        data.status !== 1 &&
        !(options as any).silent
      ) {
        if (import.meta.client) {
          useToast().add({
            title: data.message || 'Terjadi kesalahan dari server',
            description: data.error || undefined,
            color: 'error',
            duration: 5000
          })
        }
      }
    },
    async onResponseError({ response, options: originalOptions }) {
      const url = (originalOptions as any)._url || ''

      const isAuthAction =
        url.includes('/login') ||
        url.includes('/refresh-token') ||
        url.includes('/logout') ||
        url.includes('/api/auth/refresh')

      if (isAuthAction || (originalOptions as any)._retry) {
        throw response._data
      }

      if (response.status === 401) {
        ;(originalOptions as any)._retry = true

        const { refreshSession } = useAuth()
        const newToken = await refreshSession()

        if (newToken) {
          originalOptions.headers = {
            ...originalOptions.headers as any,
            Authorization: 'Bearer ' + newToken
          }
          return _fetcher!(url, originalOptions as any)
        }
      }

      throw response._data
    }
  })

  return _fetcher
}

export const useApi = async <T = ApiResponse<any>>(url: string, options: any = {}) => {
  const fetcher = getFetcher()
  options._url = url
  return fetcher<T>(url, options)
}
