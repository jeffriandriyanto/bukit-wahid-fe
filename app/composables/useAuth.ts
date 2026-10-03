export const useAuth = () => {
  const tokenCookie = useCookie<string | null>('bwr_access_token', {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax'
  })
  const refreshCookie = useCookie<string | null>('bwr_refresh_token', {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax'
  })
  const userCookie = useCookie<any | null>('bwr_user', {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax'
  })

  const token = useState<string | null>('auth_token', () => tokenCookie.value || null)
  const refreshToken = useState<string | null>('refresh_token', () => refreshCookie.value || null)
  const user = useState<any | null>('auth_user', () => userCookie.value || null)

  const config = useRuntimeConfig()
  const apiBase = config.public.baseUrl

  const setTokens = (acc: string, ref: string) => {
    token.value = acc
    refreshToken.value = ref
    tokenCookie.value = acc
    refreshCookie.value = ref
  }

  const setUser = (userData: any) => {
    user.value = userData
    userCookie.value = userData
  }

  const clearClientAuth = () => {
    token.value = null
    refreshToken.value = null
    user.value = null
    tokenCookie.value = null
    refreshCookie.value = null
    userCookie.value = null
  }

  const refreshSession = async () => {
    const currentRefresh = refreshToken.value || refreshCookie.value
    if (!currentRefresh) {
      clearClientAuth()
      return null
    }

    const maxRetries = 2
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await $fetch<any>('refresh-token', {
          baseURL: apiBase,
          method: 'PUT',
          headers: {
            Authorization: 'Bearer ' + currentRefresh
          },
          timeout: 15000
        })

        if (response?.data?.auth?.access_token) {
          setTokens(
            response.data.auth.access_token,
            response.data.auth.refresh?.token || currentRefresh
          )
          if (response.data.user) {
            setUser(response.data.user)
          }
          return response.data.auth.access_token
        }
      } catch (err: any) {
        const isTimeout = err?.message?.includes('timeout') || err?.statusCode === 504
        if (isTimeout && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          continue
        }
        clearClientAuth()
        if (import.meta.client) {
          navigateTo('/login')
        }
        return null
      }
    }

    return null
  }

  const initAuth = async () => {
    if (!import.meta.client) return

    if (refreshToken.value || refreshCookie.value) {
      await refreshSession()
    }
  }

  const logout = async () => {
    const currentToken = token.value || tokenCookie.value
    if (currentToken) {
      try {
        await $fetch('logout', {
          baseURL: apiBase,
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer ' + currentToken
          }
        })
      } catch {
        // ignore errors
      }
    }
    clearClientAuth()
    return navigateTo('/login')
  }

  return {
    token,
    refreshToken,
    user,
    initAuth,
    setTokens,
    setUser,
    logout,
    refreshSession,
    clearClientAuth
  }
}
