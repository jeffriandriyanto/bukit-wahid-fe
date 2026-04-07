<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const toast = useToast()

definePageMeta({
  layout: 'landingpage'
})

const { data: newsResponse, status } = await useFetch<any>(
  `/news/${route.params.id}`,
  {
    baseURL: config.public.baseUrl,
    key: `news-detail-${route.params.id}`
  }
)

const post = computed(() => newsResponse.value?.data)

// --- Dynamic SEO ---
useSeoMeta({
  title: () => `${post.value?.title || 'Memuat...'} - Warta RW 11`,
  ogTitle: () => post.value?.title,
  description: () => post.value?.body?.substring(0, 160),
  ogDescription: () => post.value?.body?.substring(0, 160),
  ogImage: () => post.value?.image,
  twitterCard: 'summary_large_image'
})

const shareContent = async () => {
  const shareData = {
    title: post.value?.title,
    text: post.value?.body?.substring(0, 100),
    url: window.location.href
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.add({ title: 'Tautan berhasil disalin!', color: 'success' })
    }
  } catch (err) {
    console.error('Error sharing', err)
  }
}
</script>

<template>
  <div class="bg-white min-h-screen pb-24 antialiased">
    <div class="fixed top-0 left-0 w-full h-1 bg-primary-600/10 z-[60]"></div>

    <UContainer class="py-12 max-w-4xl">
      <div class="flex justify-between items-center mb-16 animate-fade-in-up">
        <UButton
          to="/warga/pengumuman"
          variant="ghost"
          color="neutral"
          icon="i-lucide-chevron-left"
          class="rounded-full hover:bg-neutral-100 font-bold uppercase tracking-widest text-[10px]"
        >
          Daftar Pengumuman
        </UButton>
        <UButton
          icon="i-lucide-share-2"
          variant="soft"
          color="primary"
          circle
          @click="shareContent"
        />
      </div>

      <div v-if="post" class="space-y-12 animate-fade-in-up">
        <header class="space-y-8">
          <div class="space-y-4">
            <UBadge
              variant="subtle"
              color="primary"
              class="rounded-full px-4 font-black text-[10px] uppercase tracking-[0.2em]"
            >
              Berita Resmi
            </UBadge>
            <h1
              class="text-4xl md:text-6xl font-black text-neutral-950 leading-[1.1] tracking-tighter italic uppercase"
            >
              {{ post.title }}
            </h1>
          </div>

          <div
            class="flex flex-wrap items-center gap-6 text-neutral-500 py-6 border-y border-neutral-100"
          >
            <div class="flex items-center gap-3">
              <UAvatar
                :alt="post.author.name"
                size="sm"
                class="ring-2 ring-primary-50 shadow-sm"
              />
              <div class="flex flex-col leading-none">
                <span
                  class="text-xs font-black text-neutral-900 uppercase tracking-widest"
                  >{{ post.author.name }}</span
                >
                <span
                  class="text-[10px] text-neutral-400 mt-1 uppercase font-bold"
                  >Kontributor Utama</span
                >
              </div>
            </div>
            <div class="w-px h-8 bg-neutral-100 hidden sm:block"></div>
            <div class="flex items-center gap-2">
              <div class="p-2 bg-neutral-50 rounded-lg">
                <UIcon
                  name="i-lucide-calendar"
                  class="w-4 h-4 text-primary-500"
                />
              </div>
              <span
                class="text-xs font-bold uppercase tracking-widest text-neutral-600"
              >
                {{
                  post.published_at
                    ? formatDate(new Date(post.published_at), 'dd MMMM yyyy')
                    : 'Draft'
                }}
              </span>
            </div>
          </div>
        </header>

        <div class="relative group">
          <div
            class="absolute -inset-4 bg-primary-500/5 rounded-[3rem] blur-2xl group-hover:bg-primary-500/10 transition-colors duration-700"
          ></div>
          <div
            class="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl bg-neutral-100 border border-neutral-100"
          >
            <NuxtImg
              :src="post.image"
              fetchpriority="high"
              format="avif,webp"
              class="w-full h-full object-cover scale-100 hover:scale-105 transition-transform duration-1000"
              :alt="post.title"
            />
          </div>
        </div>

        <article
          class="prose prose-lg lg:prose-xl prose-neutral max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-relaxed prose-p:text-neutral-700"
        >
          <div
            class="whitespace-pre-wrap font-medium leading-loose text-neutral-700 tracking-wide text-lg first-letter:text-5xl first-letter:font-black first-letter:text-primary-600 first-letter:mr-3 first-letter:float-left"
          >
            {{ post.body }}
          </div>
        </article>

        <div
          class="pt-16 border-t border-neutral-100 flex flex-col items-center gap-6"
        >
          <p
            class="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]"
          >
            Teruskan Informasi Ini
          </p>
          <div class="flex gap-4">
            <UButton
              color="primary"
              variant="solid"
              size="xl"
              class="rounded-full px-10 shadow-lg shadow-primary-500/30 font-black uppercase tracking-widest text-[10px]"
              icon="i-simple-icons-whatsapp"
              label="Share WhatsApp"
              @click="shareContent"
            />
          </div>
        </div>
      </div>

      <div v-else-if="status === 'pending'" class="space-y-12">
        <div class="space-y-6">
          <USkeleton class="h-16 w-3/4" />
          <USkeleton class="h-6 w-1/4" />
        </div>
        <USkeleton class="h-[450px] w-full rounded-[2.5rem]" />
        <div class="space-y-4">
          <USkeleton
            v-for="i in 8"
            :key="i"
            :class="`h-4 w-${Math.floor(Math.random() * 4 + 7)}/12`"
          />
        </div>
      </div>
    </UContainer>
  </div>
</template>
