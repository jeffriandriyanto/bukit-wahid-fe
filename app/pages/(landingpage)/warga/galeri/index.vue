<template>
  <div class="bg-neutral-50/50 min-h-screen pb-24 overflow-hidden">
    <SharedLandingHeader
      badge="Arsip Dokumentasi"
      title="Galeri"
      highlight="Warga"
      subtitle="Menyimpan setiap memori, keceriaan, dan jejak gotong royong warga Bukit Wahid Regency."
    />

    <UContainer class="py-4 mt-6">
      <div
        v-if="status === 'pending'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="h-80 bg-neutral-200 animate-pulse rounded-[2.5rem]"
        />
      </div>

      <div
        v-else-if="galleries.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
      >
        <div
          v-for="(album, idx) in galleries"
          :key="album.id"
          class="group relative intersect-once intersect:animate-fade-in-up"
          :style="{ 'animation-delay': idx * 0.1 + 's' }"
        >
          <div
            class="absolute inset-0 bg-neutral-200 rounded-[2.5rem] translate-x-2 translate-y-2 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-500 opacity-50"
          />

          <div
            class="relative bg-white rounded-[2.5rem] border border-neutral-100 shadow-premium overflow-hidden cursor-pointer"
            @click="navigateTo(`/warga/galeri/${album.id}`)"
          >
            <div class="aspect-video overflow-hidden relative bg-neutral-100">
              <NuxtImg
                :src="album.cover || '/images/placeholder-gallery.jpg'"
                :alt="album.title"
                format="avif,webp"
                sizes="sm:100vw md:50vw lg:400px"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div
                class="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500"
              ></div>

              <div class="absolute top-6 right-6">
                <div
                  class="bg-black/50 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20"
                >
                  +{{ album.images_count }} Foto
                </div>
              </div>
            </div>

            <div class="p-8 space-y-4">
              <div class="flex justify-between items-center">
                <UBadge
                  variant="subtle"
                  color="primary"
                  class="rounded-full px-4 font-black text-[10px] uppercase tracking-widest"
                >
                  {{ album.category }}
                </UBadge>
                <span
                  class="text-[10px] text-neutral-400 font-black uppercase tracking-widest"
                >
                  {{ formatDate(new Date(album.event_date), 'dd MMM yyyy') }}
                </span>
              </div>

              <h3
                class="text-2xl font-black text-neutral-900 tracking-tighter leading-tight group-hover:text-primary-600 transition-colors"
              >
                {{ album.title }}
              </h3>

              <p class="text-sm text-neutral-500 line-clamp-2 leading-relaxed">
                {{ album.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="pagination.total > pagination.per_page"
        class="mt-20 flex justify-center"
      >
        <UPagination
          v-model:page="pagination.current_page"
          :total="pagination.total"
          :items-per-page="pagination.per_page"
          size="lg"
          class="font-black"
          :ui="{ root: 'rounded-full' }"
        />
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()

const pagination = ref({
  current_page: 1,
  per_page: 1,
  total: 0
})

const { data: response, status } = await useFetch<any>('/galery', {
  baseURL: config.public.baseUrl,
  query: {
    page: computed(() => pagination.value.current_page),
    limit: pagination.value.per_page
  },
  key: 'galleries-list',
  watch: [() => pagination.value.current_page]
})

const galleries = computed(() => {
  if (!response.value?.data) return []

  return response.value.data.map((item: any) => ({
    id: item.id,
    title: item.name,
    description: item.description,
    event_date: item.date,
    images_count: item.galeries_count,
    category: 'Kegiatan',
    cover: item.files?.[0]
  }))
})

watch(
  response,
  (newVal) => {
    if (newVal?.pagination) {
      pagination.value.total = newVal.pagination.total
    }
  },
  { immediate: true }
)

definePageMeta({
  layout: 'landingpage'
})

useSeoMeta({
  title: 'Galeri Momen Warga - RW 11 Bukit Wahid Regency',
  description:
    'Koleksi dokumentasi kegiatan, kerja bakti, dan perayaan warga Bukit Wahid Regency.'
})
</script>
