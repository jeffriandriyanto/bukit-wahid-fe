import { useIntersectionObserver } from '@vueuse/core'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('intersect', {
    mounted(el: HTMLElement) {
      el.classList.add('opacity-0', 'translate-y-5')
      el.style.transitionProperty = 'opacity, transform'
      el.style.transitionDuration = '800ms'
      el.style.transitionTimingFunction = 'cubic-bezier(0.21, 0.45, 0.32, 0.9)'

      const { stop } = useIntersectionObserver(
        el,
        ([entry]) => {
          if (entry?.isIntersecting) {
            el.classList.add('opacity-100', 'translate-y-0')
            el.classList.remove('opacity-0', 'translate-y-5')
            stop()
          }
        },
        { threshold: 0.1 }
      )
    }
  })
})
