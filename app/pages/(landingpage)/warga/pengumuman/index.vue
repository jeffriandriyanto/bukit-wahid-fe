<template>
  <UContainer class="py-12 space-y-8">
    <header
      class="w-full text-white mx-auto p-4 rounded-2xl bg-primary-600 border border-neutral-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
    >
      <div class="flex flex-col items-center gap-2">
        <h1 class="text-xl md:text-2xl font-bold uppercase tracking-wide">
          {{ pageData.title }}
        </h1>
        <p class="text-sm text-center leading-snug italic">
          "{{ pageData.subtitle }}"
        </p>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div
        v-for="post in allAnnouncements"
        :key="post.id"
        class="bg-white rounded-2xl border border-neutral-200 overflow-hidden h-full group hover:border-primary-500/50 cursor-pointer transition-all duration-300"
        @click="navigateTo(`/warga/pengumuman/${post.id}`)"
      >
        <div class="aspect-video overflow-hidden">
          <img
            :src="post.image"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            :alt="post.title"
          >
        </div>

        <div class="p-5 space-y-3">
          <div
            class="flex items-center gap-2 text-xs text-neutral-500 font-medium"
          >
            <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5" />
            {{ post.published_at ? formatDate(post.published_at) : 'Draft' }}
            <span class="text-neutral-700">|</span>
            <UIcon name="i-lucide-user" class="w-3.5 h-3.5" />
            {{ post.author.name }}
          </div>

          <h2
            class="text-xl font-bold group-hover:text-primary-400 transition-colors line-clamp-1"
          >
            {{ post.title }}
          </h2>

          <p class="text-neutral-400 text-sm line-clamp-3 leading-relaxed">
            {{ post.body }}
          </p>
        </div>

        <div
          class="flex items-center justify-between text-primary-500 font-bold text-sm p-5 border-t border-neutral-50"
        >
          <span>Baca Selengkapnya</span>
          <UIcon
            name="i-lucide-arrow-right"
            class="group-hover:translate-x-1 transition-transform"
          />
        </div>
      </div>
    </div>

    <div v-if="hasMore" class="flex justify-center pt-8">
      <UButton
        :loading="status === 'pending'"
        variant="ghost"
        color="primary"
        class="px-10 py-3 rounded-full border-2 border-primary-500 font-bold hover:bg-primary-50 transition-all"
        @click="loadMore"
      >
        Tampilkan Lebih Banyak
      </UButton>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()

interface AnnouncementItem {
  id: string
  title: string
  slug: string
  image: string
  body: string
  published_at: string | null
  author: { name: string }
}

definePageMeta({
  layout: 'landingpage'
})

// --- State ---
const currentPage = ref(1)
const perPage = 6
const allAnnouncements = ref<AnnouncementItem[]>([])

const pageData = reactive({
  title: 'Pengumuman Warga',
  subtitle:
    'Pusat informasi, berita, dan pengumuman resmi RW.11 Bukit Wahid Regency.'
})

// --- SEO ---
useSeoMeta({
  title: `${pageData.title} - RW 11 Bukit Wahid Regency`,
  ogTitle: pageData.title,
  description: pageData.subtitle,
  ogDescription: pageData.subtitle,
  twitterCard: 'summary_large_image'
})

// --- Data Fetching (SSR Friendly) ---
const { data: newsResponse, status } = await useFetch<any>('/news', {
  baseURL: config.public.baseUrl,
  query: {
    page: currentPage,
    limit: perPage
  },
  key: 'announcements-list'
})

watch(
  newsResponse,
  (newData) => {
    if (newData?.data) {
      const newItems = newData.data.filter(
        (newItem: AnnouncementItem) =>
          !allAnnouncements.value.some((oldItem) => oldItem.id === newItem.id)
      )
      allAnnouncements.value.push(...newItems)
    }
  },
  { immediate: true }
)

const hasMore = computed(() => {
  if (!newsResponse.value) return false
  return (newsResponse.value?.data?.length || 0) >= perPage
})

const loadMore = () => {
  currentPage.value++
}
</script>
