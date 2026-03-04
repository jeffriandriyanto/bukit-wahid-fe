<template>
  <UContainer class="py-12 max-w-4xl">
    <UButton
      to="/warga/pengumuman"
      variant="ghost"
      color="neutral"
      icon="i-lucide-arrow-left"
      class="mb-4"
    >
      Kembali ke Daftar Pengumuman
    </UButton>

    <div v-if="post">
      <div class="space-y-4">
        <h1 class="text-3xl md:text-5xl font-black text-neutral-900 leading-tight">
          {{ post.title }}
        </h1>

        <div class="flex items-center gap-4 text-sm text-neutral-500 border-y border-neutral-100 py-4">
          <div class="flex items-center gap-2">
            <UAvatar :alt="post.author.name" size="xs" />
            <span class="font-bold text-neutral-700">{{ post.author.name }}</span>
          </div>
          <span>•</span>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-calendar" />
            {{ post.published_at ? formatDate(post.published_at) : 'Draft' }}
          </div>
        </div>
      </div>

      <div class="relative aspect-video rounded-3xl overflow-hidden shadow-2xl mb-4">
        <img
          :src="post.image"
          class="w-full h-full object-cover"
          :alt="post.title"
        >
      </div>

      <div class="prose prose-lg prose-neutral max-w-none">
        <p class="text-neutral-600 leading-relaxed whitespace-pre-wrap text-lg">
          {{ post.body }}
        </p>
      </div>

      <div class="pt-12 border-t border-neutral-100">
        <p class="text-sm font-bold text-neutral-400 uppercase mb-4">Bagikan Informasi ini</p>
        <div class="flex gap-2 mt-2">
          <UButton
            color="success"
            variant="subtle"
            class="cursor-pointer"
            icon="i-simple-icons-whatsapp"
            @click="shareToWA"
          >
            WhatsApp
          </UButton>
        </div>
      </div>
    </div>

    <div v-else-if="status === 'pending'" class="space-y-6">
      <USkeleton class="h-12 w-3/4" />
      <USkeleton class="h-64 w-full rounded-3xl" />
      <USkeleton v-for="i in 5" :key="i" class="h-4 w-full" />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()

definePageMeta({
  layout: 'landingpage'
})

const { data: newsResponse, status } = await useFetch<any>(`/news/${route.params.id}`, {
  baseURL: config.public.baseUrl,
  key: `news-detail-${route.params.id}`
})

const post = computed(() => newsResponse.value?.data)

useSeoMeta({
  title: () => post.value?.title || 'Memuat...',
  ogTitle: () => post.value?.title,
  description: () => post.value?.body?.substring(0, 160),
  ogDescription: () => post.value?.body?.substring(0, 160),
  ogImage: () => post.value?.image,
  twitterCard: 'summary_large_image',
})

const shareToWA = () => {
  const url = window.location.href
  window.open(`https://wa.me/?text=${encodeURIComponent(post.value.title + '\n' + url)}`, '_blank')
}
</script>
