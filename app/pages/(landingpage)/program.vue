<script setup lang="ts">
// [SEO Update]
const title = 'Program Kerja Strategis RW 11 Bukit Wahid Regency'
const description =
  'Eksplorasi rencana kerja jangka pendek dan jangka panjang pengurus RW 11 untuk lingkungan yang lebih baik.'

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

definePageMeta({
  layout: 'landingpage'
})

// State management
const searchQuery = ref('')
const selectedCategory = ref('Semua')
const categories = ['Semua', 'Jangka Pendek', 'Jangka Panjang']

const programs = ref([
  {
    id: 1,
    category: 'Jangka Pendek',
    work_program: 'Penguatan Internal & Legalitas',
    duration: '1 Tahun',
    pic: 'Ketua RW',
    icon: 'i-lucide-shield-check',
    color: 'primary',
    details: [
      'Konsolidasi organisasi ke RW an dan EM.',
      'Penyusunan Pedoman Rukun Warga XI BWR',
      'Penggunaan SIM ke RW dan RT an'
    ]
  },
  {
    id: 2,
    category: 'Jangka Panjang',
    work_program: 'Pemberdayaan Ekonomi & Lingkungan',
    duration: '2 Tahun',
    pic: 'Ketua RW',
    icon: 'i-lucide-leaf',
    color: 'amber',
    details: [
      'Pemberdayaan Unit Koperasi agar profit meningkat.',
      'Terbangunnya Apotik hidup untuk semua RT.'
    ]
  }
])

const filteredRows = computed(() => {
  if (!programs.value) return []
  return programs.value.filter((p) => {
    const query = searchQuery.value.toLowerCase()
    const nameMatch = p.work_program?.toLowerCase().includes(query)
    const detailMatch = p.details?.some((d) => d.toLowerCase().includes(query))
    const isVisibleBySearch = nameMatch || detailMatch
    const isVisibleByCategory =
      selectedCategory.value === 'Semua' ||
      p.category === selectedCategory.value
    return isVisibleBySearch && isVisibleByCategory
  })
})
</script>

<template>
  <div class="bg-neutral-50/50 min-h-screen pb-24 overflow-hidden">
    <SharedLandingHeader
      badge="Strategic Roadmap"
      title="Program"
      highlight="Kerja"
      subtitle="Rencana aksi nyata pengurus untuk mewujudkan lingkungan RW 11 yang mandiri dan berdaya saing."
    />

    <UContainer class="py-4">
      <div
        class="bg-white p-6 rounded-4xl shadow-premium mb-12 flex flex-col md:flex-row gap-6 items-center border border-neutral-100 intersect-once intersect:animate-fade-in-up"
      >
        <div class="flex items-center gap-4 grow">
          <div class="p-3 bg-primary-50 rounded-2xl text-primary-600">
            <UIcon name="i-lucide-clipboard-list" class="w-6 h-6" />
          </div>
          <div>
            <span
              class="block text-2xl font-black text-neutral-900 leading-none"
              >{{ filteredRows.length }}</span
            >
            <span
              class="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400"
              >Total Program</span
            >
          </div>
        </div>

        <div class="flex flex-wrap gap-3 w-full md:w-auto">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Cari rencana program..."
            color="neutral"
            variant="subtle"
            class="grow md:w-80"
            size="lg"
            :ui="{ base: 'rounded-full' }"
          />
          <USelectMenu
            v-model="selectedCategory"
            :options="categories"
            color="neutral"
            variant="subtle"
            class="w-full md:w-48"
            size="lg"
            :ui="{ base: 'rounded-full' }"
          />
        </div>
      </div>

      <div v-if="filteredRows.length > 0" class="space-y-8 relative">
        <div
          class="absolute left-10 top-0 bottom-0 w-px bg-neutral-200 hidden lg:block"
        />

        <div
          v-for="(item, idx) in filteredRows"
          :key="item.id"
          class="relative pl-0 lg:pl-24 intersect-once intersect:animate-fade-in-up"
          :style="{ 'animation-delay': idx * 0.1 + 's' }"
        >
          <div
            class="absolute left-8.5 top-12 w-3 h-3 rounded-full bg-white border-2 border-primary-500 hidden lg:block z-10 shadow-[0_0_10px_rgba(var(--color-primary-500),0.5)]"
          />

          <div
            class="group bg-white rounded-[2.5rem] border border-neutral-100 shadow-premium hover:shadow-premium-hover transition-all duration-500 overflow-hidden flex flex-col lg:flex-row"
          >
            <div
              class="lg:w-72 p-8 lg:border-r border-neutral-100 bg-neutral-50/30 flex flex-col justify-between"
            >
              <div class="space-y-4">
                <UBadge
                  :color="
                    item.category === 'Jangka Pendek' ? 'primary' : 'secondary'
                  "
                  variant="subtle"
                  class="rounded-full px-4 font-black text-[10px] uppercase tracking-widest"
                >
                  {{ item.category }}
                </UBadge>
                <h3
                  class="text-2xl font-black text-neutral-900 tracking-tighter leading-tight group-hover:text-primary-600 transition-colors"
                >
                  {{ item.work_program }}
                </h3>
              </div>

              <div class="mt-8 space-y-3 pt-6 border-t border-neutral-200/50">
                <div class="flex items-center gap-3 text-neutral-500">
                  <UIcon
                    name="i-lucide-calendar"
                    class="w-4 h-4 text-primary-500"
                  />
                  <span class="text-xs font-bold uppercase tracking-wider">{{
                    item.duration
                  }}</span>
                </div>
                <div class="flex items-center gap-3 text-neutral-500">
                  <UIcon
                    name="i-lucide-user"
                    class="w-4 h-4 text-primary-500"
                  />
                  <span class="text-xs font-bold uppercase tracking-wider"
                    >PJ: {{ item.pic }}</span
                  >
                </div>
              </div>
            </div>

            <div class="flex-1 p-8 lg:p-12 relative overflow-hidden">
              <UIcon
                :name="item.icon"
                class="absolute -right-8 -bottom-8 w-48 h-48 opacity-[0.03] text-neutral-900"
              />

              <div class="relative z-10">
                <p
                  class="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-6"
                >
                  Poin Implementasi
                </p>
                <ul class="space-y-4">
                  <li
                    v-for="(detail, dIdx) in item.details"
                    :key="dIdx"
                    class="flex items-start gap-4 text-neutral-600 group/item"
                  >
                    <div
                      class="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0 shadow-[0_0_8px_rgba(var(--color-primary-500),0.4)] group-hover/item:scale-150 transition-transform"
                    />
                    <span class="text-base font-medium leading-relaxed">{{
                      detail
                    }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="py-32 flex flex-col items-center justify-center animate-fade-in-up"
      >
        <div
          class="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6"
        >
          <UIcon name="i-lucide-search-x" class="w-12 h-12 text-neutral-300" />
        </div>
        <h4 class="text-xl font-bold text-neutral-900">
          Program Tidak Ditemukan
        </h4>
        <p class="text-neutral-500 mt-2">
          Coba gunakan kata kunci lain atau filter kategori yang berbeda.
        </p>
        <UButton
          color="neutral"
          variant="link"
          class="mt-4"
          @click="
            searchQuery = '',
            selectedCategory = 'Semua'
          "
          >Reset Filter</UButton
        >
      </div>

      <div
        class="mt-24 pt-12 border-t border-neutral-200 text-center animate-fade-in-up"
      >
        <UIcon
          name="i-lucide-target"
          class="text-primary-500 w-12 h-12 mx-auto mb-8 opacity-20"
        />
        <p
          class="text-3xl font-serif text-neutral-400 italic max-w-3xl mx-auto leading-relaxed"
        >
          "Setiap program dirancang bukan hanya untuk hari ini, tapi sebagai
          fondasi kesejahteraan warga di masa depan."
        </p>
      </div>
    </UContainer>
  </div>
</template>

<style scoped>
.group-hover\/item\:scale-150 {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
</style>
