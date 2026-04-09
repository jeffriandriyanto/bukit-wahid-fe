import { defineStore } from 'pinia'
import { ref } from 'vue'

// 1. Interface untuk konsistensi data di seluruh aplikasi
interface SiteConfig {
  address: string
  email: string
  whatsapp: string
  greeting: string
  instagram: string | null
  facebook: string | null
  youtube: string | null
  twitter: string | null
  fasum: string[]
  kegiatan: string[]
  hero_banner: string | null
  link_googleplay: string
}

export const useConfigStore = defineStore('configStore', () => {
  const values = ref<SiteConfig>({
    address: '',
    email: '',
    whatsapp: '',
    greeting: '',
    instagram: '',
    facebook: '',
    youtube: '',
    twitter: '',
    fasum: [],
    kegiatan: [],
    hero_banner: "",
    link_googleplay: ""
  })

  const isLoaded = ref(false)

  // 3. Helper Transformer (Internal Store)
  const cleanData = (rawData: any[]): Partial<SiteConfig> => {
    const cleaned: any = {}
    rawData.forEach((item) => {
      const key = Object.keys(item)[0]
      let value = item[key]

      if (typeof value === 'string') {
        // Un-escape HTML entities dari backend
        value = value.replace(/&#34;/g, '"')

        // Auto-parse jika formatnya adalah stringified array
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value)
          } catch (e) {
            value = []
          }
        }
      }
      cleaned[key] = value
    })
    return cleaned
  }

  // 4. Action untuk Fetch Data (SSR-Ready)
  const fetchConfig = async () => {
    const runtime = useRuntimeConfig()

    try {
      // Gunakan $fetch untuk operasi di dalam Store/Action Nuxt 3
      const res = await $fetch<any>('/environment', {
        baseURL: runtime.public.baseUrl,
        query: { page: 1, limit: 50 }
      })

      if (res?.data?.data) {
        const cleaned = cleanData(res.data.data)
        values.value = { ...values.value, ...cleaned }
        isLoaded.value = true
      }
    } catch (error) {
      console.error('Error fetching site configuration:', error)
    }
  }

  return { values, isLoaded, fetchConfig }
})
