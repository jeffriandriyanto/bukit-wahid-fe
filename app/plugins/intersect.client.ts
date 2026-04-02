import { Observer } from 'tailwindcss-intersect'

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    nextTick(() => {
      try {
        Observer.start()
        console.log('🚀 Intersection Observer started successfully!')
      } catch (e) {
        console.error('❌ Failed to start Intersection Observer:', e)
      }
    })
  }
})
