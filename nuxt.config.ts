// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxt/image',
    'nuxt-echarts'
  ],
  devtools: {
    enabled: true
  },
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'light',
    fallback: 'light',
    storageKey: 'nuxt-color-mode'
  },
  runtimeConfig: {
    public: {
      siteUrl: 'https://bukit-wahid-regency.netlify.app',
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || ''
    },
    apiSecret: ''
  },
  routeRules: {
    '/': { prerender: true }
  },
  compatibilityDate: '2025-01-15',
  // nitro: {
  //   preset: 'netlify'
  // },
  eslint: {
    config: {
      stylistic: false
    }
  }
})
