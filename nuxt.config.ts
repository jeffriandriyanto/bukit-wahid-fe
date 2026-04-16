export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxt/image',
    'nuxt-charts',
    '@pinia/nuxt'
  ],
  experimental: {
    scanPageMeta: false,
  },
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
      version: "1.6.1",
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
  },
  vite: {
    build: {
      rollupOptions: {
        external: ['@nuxt/nitro-server']
      }
    },
    server: {
      watch: {
        usePolling: true,
      }
    }
  },
})
