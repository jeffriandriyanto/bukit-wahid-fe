export default defineNuxtRouteMiddleware(async (_to, _from) => {
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
        if (!canAccessWebAdmin(user.value)) {
          useToast().add({
            title: 'Akses Ditolak',
            description: 'Hanya Super Admin, Estate Management (EM), dan Pengurus/Pejabat RW yang dapat mengakses web admin.',
            color: 'error'
          })
          return logout()
        }
        return
      }
    }

    return navigateTo('/login', { replace: true })
  }

  if (!canAccessWebAdmin(user.value)) {
    useToast().add({
      title: 'Akses Ditolak',
      description: 'Hanya Super Admin, Estate Management (EM), dan Pengurus/Pejabat RW yang dapat mengakses web admin.',
      color: 'error'
    })
    return logout()
  }
})
