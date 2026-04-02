<script setup lang="ts">
import { galleries } from '~/dummies/galleri'
const route = useRoute()
const toast = useToast()

const isModalOpen = ref(false)
const selectedIndex = ref(0)
const album = galleries.find((a) => a.id === route.params.id)

const shareAlbum = async () => {
  const shareData = {
    title: album?.title,
    url: window.location.href
  }
  try {
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.add({ title: 'Tautan album disalin!', color: 'success' })
    }
  } catch (err) {
    console.log(err)
  }
}

const selectedImg = computed(() => album?.images[selectedIndex.value] || '')

const openLightbox = (idx: number) => {
  selectedIndex.value = idx
  isModalOpen.value = true
}

const nextPhoto = () => {
  selectedIndex.value = (selectedIndex.value + 1) % (album?.images.length || 1)
}

const prevPhoto = () => {
  selectedIndex.value =
    (selectedIndex.value - 1 + (album?.images.length || 1)) %
    (album?.images.length || 1)
}

onKeyStroke(['ArrowRight'], () => {
  if (isModalOpen.value) nextPhoto()
})
onKeyStroke(['ArrowLeft'], () => {
  if (isModalOpen.value) prevPhoto()
})

definePageMeta({ layout: 'landingpage' })
</script>

<template>
  <div v-if="album" class="min-h-screen bg-white pb-24">
    <SharedLandingHeader
      :badge="album.category"
      :title="album.title"
      :subtitle="album.description"
    />

    <UContainer class="py-4 mt-6">
      <div class="flex justify-between items-center mb-12 animate-fade-in-up">
        <UButton
          to="/warga/galeri"
          variant="ghost"
          color="neutral"
          icon="i-lucide-chevron-left"
          class="rounded-full font-black uppercase tracking-widest text-[10px]"
          label="Kembali ke Daftar"
        />

        <div class="flex items-center gap-4">
          <div class="hidden md:flex flex-col items-end leading-none">
            <span
              class="text-[10px] font-black text-neutral-400 uppercase tracking-widest"
              >Waktu Kegiatan</span
            >
            <span class="text-sm font-bold text-neutral-900">{{
              formatDate(new Date(album.event_date), 'dd MMMM yyyy')
            }}</span>
          </div>
          <UButton
            color="primary"
            variant="solid"
            icon="i-lucide-share-2"
            class="rounded-full px-6 shadow-lg shadow-primary-500/20"
            label="Bagikan"
            @click="shareAlbum"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        <div
          v-for="(img, idx) in album.images"
          :key="idx"
          class="group relative cursor-pointer overflow-hidden rounded-[3rem] bg-neutral-100 border border-neutral-100 shadow-premium intersect-once intersect:animate-fade-in-up"
          :style="{ 'animation-delay': idx * 0.1 + 's' }"
          @click="openLightbox(idx)"
        >
          <NuxtImg
            :src="img"
            format="avif,webp"
            sizes="sm:100vw md:80vw lg:600px"
            class="w-full h-full min-h-100 object-cover group-hover:scale-105 transition-transform duration-1000"
          />

          <div
            class="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
          >
            <div class="bg-white/20 p-5 rounded-full ring-1 ring-white/50">
              <UIcon name="i-lucide-maximize-2" class="text-white w-8 h-8" />
            </div>
          </div>
        </div>
      </div>
    </UContainer>

    <UModal
      v-model:open="isModalOpen"
      :ui="{
        content: 'sm:max-w-5xl p-0 bg-white overflow-visible'
      }"
    >
      <template #header>
        <div class="flex justify-between w-full items-center">
          <div class="font-black text-base">
            {{ album.title }}
          </div>

          <UButton
            icon="mdi:close"
            variant="ghost"
            @click="isModalOpen = false"
          />
        </div>
      </template>
      <template #body>
        <div class="relative w-full flex items-center justify-center">
          <div
            class="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-10 pointer-events-none z-60"
          >
            <UButton
              icon="i-lucide-chevron-left"
              variant="ghost"
              size="xl"
              class="pointer-events-auto rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md"
              @click="prevPhoto"
            />
            <UButton
              icon="i-lucide-chevron-right"
              variant="ghost"
              size="xl"
              class="pointer-events-auto rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md"
              @click="nextPhoto"
            />
          </div>

          <div class="relative flex flex-col items-center gap-6 w-full">
            <NuxtImg
              :src="selectedImg"
              loading="eager"
              class="w-full max-h-[75vh] object-contain rounded-2xl"
            />

            <div class="text-center space-y-2">
              <p class="text-xs">
                Foto {{ selectedIndex + 1 }} dari {{ album.images.length }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
