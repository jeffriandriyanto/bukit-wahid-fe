<template>
  <UContainer class="py-12 space-y-12">
    <header
      class="max-w-3xl mx-auto p-8 rounded-2xl bg-neutral-50/50 border border-neutral-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
    >
      <div class="flex flex-col items-center gap-2">
        <div class="w-12 h-1 bg-primary-500 rounded-full mb-2"></div>

        <h1
          class="text-xl md:text-2xl font-bold text-neutral-800 uppercase tracking-wide"
        >
          {{ pageData.title }}
        </h1>
        <p class="text-neutral-500 text-sm text-center leading-snug italic">
          "{{ pageData.subtitle }}"
        </p>
      </div>
    </header>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        v-for="(img, idx) in pageData.gallery"
        :key="idx"
        class="aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 relative group"
        @click="openLightbox(img)"
      >
        <div
          class="absolute inset-0 bg-primary-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 flex items-center justify-center"
        >
          <UIcon
            name="i-lucide-maximize-2"
            class="text-white w-8 h-8 scale-50 group-hover:scale-100 transition-transform duration-500"
          />
        </div>

        <img
          :src="img"
          loading="lazy"
          class="w-full h-full object-cover hover:scale-110 transition-transform duration-700 cursor-pointer"
          alt="Dokumentasi RW 11"
        />
      </div>
    </div>

    <UModal
      v-model:open="isModalOpen"
      title="Detail Dokumentasi"
      :description="`Foto kegiatan RW.11`"
      :ui="{
        content: 'sm:max-w-2xl'
      }"
    >
      <template #body>
        <div class="flex flex-col items-center gap-4">
          <img
            :src="selectedImg"
            class="w-full h-auto rounded-lg shadow-xl"
            alt="Full view"
          >
        </div>
      </template>
    </UModal>

    <div class="text-center pt-8">
      <p class="text-neutral-500 text-xs tracking-widest uppercase">
        Klik foto untuk memperbesar
      </p>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'landingpage'
})

const isModalOpen = ref(false)
const selectedImg = ref('')

const pageData = reactive({
  title: 'Galeri RW.11',
  subtitle: 'Momen kebersamaan dan gotong royong warga Bukit Wahid Regency.',
  gallery: [
    'https://picsum.photos/600/600?random=10',
    'https://picsum.photos/600/600?random=11',
    'https://picsum.photos/600/600?random=12',
    'https://picsum.photos/600/600?random=13',
    'https://picsum.photos/600/600?random=14',
    'https://picsum.photos/600/600?random=15',
    'https://picsum.photos/600/600?random=16',
    'https://picsum.photos/600/600?random=17',
    'https://picsum.photos/600/600?random=18',
    'https://picsum.photos/600/600?random=19',
    'https://picsum.photos/600/600?random=20',
    'https://picsum.photos/600/600?random=21'
  ]
})

const openLightbox = (img: string) => {
  selectedImg.value = img
  isModalOpen.value = true
}
</script>
