export const useAuth = () => {
  const token = useState<string | null>('auth_token', () => null)
  const refreshToken = useState<string | null>('refresh_token', () => null)
  const user = useState<any | null>('auth_user', () => null)

  const initAuth = () => {
    if (import.meta.client) {
      token.value = localStorage.getItem('access_token')
      refreshToken.value = localStorage.getItem('refresh_token')
      const savedUser = localStorage.getItem('auth_user')
      if (savedUser) {
        try {
          user.value = JSON.parse(savedUser)
        } catch (e) {
          user.value = null
        }
      }
    }
  }

  const clearClientAuth = () => {
    token.value = null
    refreshToken.value = null
    user.value = null

    if (import.meta.client) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('auth_user')
    }
  }

  const setTokens = (acc: string, ref: string) => {
    token.value = acc
    refreshToken.value = ref
    if (import.meta.client) {
      localStorage.setItem('access_token', acc)
      localStorage.setItem('refresh_token', ref)
    }
  }

  const setUser = (userData: any) => {
    user.value = userData
    if (import.meta.client) {
      localStorage.setItem('auth_user', JSON.stringify(userData))
    }
  }

  const logout = async () => {
    try {
      await useApi('/logout', {
        method: 'DELETE',
        _retry: true
      })
    } catch (e) {
      console.error('Logout API failed, cleaning up client anyway...', e)
    } finally {
      clearClientAuth()
      return navigateTo('/login')
    }
  }

  const refreshSession = async () => {
    if (!refreshToken.value) return null

    try {
      const response = await $fetch<any>('/refresh-token', {
        baseURL: useRuntimeConfig().public.baseUrl,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${refreshToken.value}`
        }
      })

      const { access_token, refresh } = response.data.auth
      setTokens(access_token, refresh.token)
      setUser(response.data.user)

      return access_token
    } catch (err) {
      clearClientAuth()
      navigateTo('/login')
      return null
    }
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
