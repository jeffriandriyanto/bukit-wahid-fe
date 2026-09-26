export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookieSafe(event, 'refresh_token')

  try {
    await $fetch('/logout', {
      baseURL: config.public.baseUrl,
      method: 'DELETE',
      headers: token ? { Authorization: 'Bearer ' + token } : {}
    })
  } catch {
    // ignore backend errors — clear cookie anyway
  }

  deleteCookieSafe(event, 'refresh_token', { path: '/' })

  return { status: 1, message: 'Logged out' }
})
