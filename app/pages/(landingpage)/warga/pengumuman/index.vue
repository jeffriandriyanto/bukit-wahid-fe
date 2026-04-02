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

// --- SEO ---
useSeoMeta({
  title: 'Warta & Pengumuman RW 11 Bukit Wahid Regency',
  description:
    'Pusat informasi resmi, berita kegiatan, dan pengumuman penting bagi seluruh warga Bukit Wahid Regency.',
  ogImage: '/images/landingpage.png'
})

// --- Data Fetching ---
const { data: newsResponse, status } = await useFetch<any>('/news', {
  baseURL: config.public.baseUrl,
  query: {
    page: currentPage,
    limit: perPage
  },
  key: 'announcements-list',
  watch: [currentPage]
})

watch(
  newsResponse,
  (newData) => {
    if (newData?.data) {
      if (currentPage.value === 1) {
        allAnnouncements.value = newData.data
      } else {
        const newItems = newData.data.filter(
          (newItem: AnnouncementItem) =>
            !allAnnouncements.value.some((oldItem) => oldItem.id === newItem.id)
        )
        allAnnouncements.value.push(...newItems)
      }
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

<template>
  <div class="bg-neutral-50/50 min-h-screen pb-24 overflow-hidden">
    <SharedLandingHeader
      badge="Warta Warga"
      title="Informasi &"
      highlight="Pengumuman"
      subtitle="Tetap terupdate dengan berita terbaru, kebijakan pengurus, dan informasi resmi di lingkungan RW 11."
    />

    <UContainer class="py-4">
      <div
        v-if="allAnnouncements.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
      >
        <div
          v-for="(post, idx) in allAnnouncements"
          :key="post.id"
          class="group bg-white rounded-[2.5rem] border border-neutral-100 shadow-premium hover:shadow-premium-hover transition-all duration-700 flex flex-col overflow-hidden intersect-once intersect:animate-fade-in-up cursor-pointer"
          :style="{ 'animation-delay': idx * 0.1 + 's' }"
          @click="navigateTo(`/warga/pengumuman/${post.id}`)"
        >
          <div class="aspect-[16/10] overflow-hidden relative">
            <NuxtImg
              :src="post.image"
              :alt="post.title"
              format="avif,webp"
              sizes="sm:100vw md:50vw lg:400px"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
            />
            <div
              class="absolute top-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-[10px] font-black text-white uppercase tracking-widest"
            >
              {{
                post.published_at
                  ? formatDate(new Date(post.published_at), 'dd MMM yyyy')
                  : 'Terbaru'
              }}
            </div>
          </div>

          <div class="p-8 flex-1 flex flex-col">
            <div class="flex items-center gap-3 mb-4">
              <UAvatar
                :alt="post.author.name"
                size="2xs"
                class="ring-1 ring-neutral-200"
              />
              <span
                class="text-[10px] font-black text-primary-500 uppercase tracking-widest"
                >{{ post.author.name }}</span
              >
            </div>

            <h2
              class="text-2xl font-extrabold text-neutral-900 leading-tight tracking-tight group-hover:text-primary-600 transition-colors mb-4 line-clamp-2"
            >
              {{ post.title }}
            </h2>

            <p
              class="text-neutral-500 text-sm leading-relaxed line-clamp-3 mb-8"
            >
              {{ post.body }}
            </p>

            <div
              class="mt-auto flex items-center justify-between pt-6 border-t border-neutral-50 text-primary-600"
            >
              <span class="text-xs font-black uppercase tracking-widest"
                >Baca Detail</span
              >
              <div
                class="p-2 bg-primary-50 rounded-full group-hover:bg-primary-600 group-hover:text-white transition-all"
              >
                <UIcon
                  name="i-lucide-arrow-right"
                  class="w-4 h-4 group-hover:translate-x-1 transition-transform"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="status !== 'pending'"
        class="py-32 flex flex-col items-center justify-center animate-fade-in-up"
      >
        <div
          class="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6 text-neutral-300"
        >
          <UIcon name="i-lucide-newspaper" class="w-12 h-12" />
        </div>
        <h4 class="text-xl font-bold text-neutral-900 tracking-tight">
          Belum Ada Pengumuman
        </h4>
        <p class="text-neutral-500 mt-2">
          Arsip informasi sedang diperbarui oleh pengurus.
        </p>
      </div>

      <div v-if="hasMore" class="flex justify-center pt-20">
        <UButton
          :loading="status === 'pending'"
          variant="solid"
          color="neutral"
          size="xl"
          class="rounded-full px-12 font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
          @click="loadMore"
        >
          Muat Berita Lainnya
        </UButton>
      </div>
    </UContainer>
  </div>
</template>
