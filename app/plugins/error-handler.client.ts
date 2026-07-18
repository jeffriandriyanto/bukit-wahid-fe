export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (err, _instance, info) => {
    console.error('[Global Error]', info, err)

    if (import.meta.client) {
      const toast = useToast()

      let message = 'Terjadi kesalahan yang tidak terduga'

      if (err instanceof Error) {
        message = err.message
      } else if (typeof err === 'object' && err !== null) {
        message = (err as any).message || (err as any).statusMessage || message
      }

      toast.add({
        title: 'Error',
        description: message,
        color: 'error',
        duration: 5000
      })
    }
  }

  nuxtApp.hook('vue:error', (err, _instance, info) => {
    console.error('[Vue Error Hook]', info, err)
  })
})
