export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxt/image',
    'nuxt-charts',
    '@pinia/nuxt'
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
      version: "1.3.7",
      siteUrl: 'https://rw11bukitwahid.com',
      baseUrl: process?.env?.NUXT_PUBLIC_BASE_URL || ''
    },
    apiSecret: ''
  },
  compatibilityDate: '2025-01-15',
  eslint: {
    config: {
      stylistic: false
    }
  }
})
