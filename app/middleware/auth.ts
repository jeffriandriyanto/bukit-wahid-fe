export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) return

  const { token, refreshToken, refreshSession } = useAuth()

  if (!token.value) {
    if (refreshToken.value) {
      let ok = await refreshSession()

      if (!ok) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        ok = await refreshSession()
      }

      if (ok) return
    }

    return navigateTo('/login', { replace: true })
  }
})
