export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) return

  const { token, refreshToken, user, refreshSession, logout } = useAuth()

  if (!token.value) {
    if (refreshToken.value) {
      let ok = await refreshSession()

      if (!ok) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        ok = await refreshSession()
      }

      if (ok) {
        if (user.value?.person?.category === 'security') {
          useToast().add({
            title: 'Akses Ditolak',
            description: 'Akun Security hanya dapat digunakan melalui aplikasi mobile.',
            color: 'error'
          })
          return logout()
        }
        return
      }
    }

    return navigateTo('/login', { replace: true })
  }

  if (user.value?.person?.category === 'security') {
    useToast().add({
      title: 'Akses Ditolak',
      description: 'Akun Security hanya dapat digunakan melalui aplikasi mobile.',
      color: 'error'
    })
    return logout()
  }
})
