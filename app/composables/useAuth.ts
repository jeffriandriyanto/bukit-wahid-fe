export const useAuth = () => {
  const token = useState<string | null>('auth_token', () => null)
  const refreshToken = useState<string | null>('refresh_token', () => null)
  const user = useState<any | null>('auth_user', () => null)

  const initAuth = async () => {
    if (!import.meta.client) return

    try {
      const response = await $fetch<any>('/api/auth/refresh')

      if (response?.data?.auth?.access_token) {
        token.value = response.data.auth.access_token
        refreshToken.value = response.data.auth.refresh.token
        user.value = response.data.user
      }
    } catch {
      // not authenticated — that's fine
    }
  }

  const clearClientAuth = () => {
    token.value = null
    refreshToken.value = null
    user.value = null
  }

  const setTokens = (acc: string, ref: string) => {
    token.value = acc
    refreshToken.value = ref
  }

  const setUser = (userData: any) => {
    user.value = userData
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore errors
    }
    clearClientAuth()
    return navigateTo('/login')
  }

  const refreshSession = async () => {
    try {
      const response = await $fetch<any>('/api/auth/refresh')

      if (response?.data?.auth?.access_token) {
        token.value = response.data.auth.access_token
        refreshToken.value = response.data.auth.refresh.token
        user.value = response.data.user
        return response.data.auth.access_token
      }
    } catch {
      clearClientAuth()
      navigateTo('/login')
      return null
    }

    return null
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
