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

    <div
      class="flex flex-col md:flex-row gap-4 justify-between items-center p-4"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-bold text-primary-500">{{
          filteredAgendas.length
        }}</span>
        <span class="text-neutral-400 font-medium">Agenda</span>
      </div>

      <div class="flex gap-3 w-full md:w-auto">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Cari agenda..."
          color="neutral"
          class="grow md:w-64"
        />
        <USelectMenu
          v-model="selectedCategory"
          :options="categories"
          placeholder="Filter"
          color="neutral"
          class="w-40"
        />
      </div>
    </div>

    <div
      v-if="filteredAgendas.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <UCard
        v-for="item in filteredAgendas"
        :key="item.id"
        :ui="{
          root: 'overflow-hidden group hover:ring-2 hover:ring-primary-500 transition-all duration-300',
          body: 'bg-neutral-100'
        }"
      >
        <template #header>
          <div
            class="bg-primary-600 px-4 py-2 flex justify-between items-center text-white"
          >
            <div
              class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              <UIcon name="i-lucide-calendar" />
              {{ formatDate(item.start_date) }}
            </div>
            <div
              class="flex items-center gap-1 text-xs font-mono bg-black/20 px-2 py-1 rounded"
            >
              <UIcon name="i-lucide-clock" />
              {{ item.start_time }}
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <h3 class="text-xl font-bold transition-colors">
              {{ item.title }}
            </h3>
            <p class="text-neutral-400 text-sm mt-2 line-clamp-2">
              {{ item.description }}
            </p>
          </div>

          <div class="flex items-start gap-2 text-sm">
            <UIcon
              name="i-lucide-map-pin"
              class="mt-1 text-primary-500 shrink-0"
            />
            <div class="grow">
              <span
                v-if="!isLink(item.location)"
                class="text-neutral-600 italic"
              >
                {{ item.location }}
              </span>
              <NuxtLink
                v-else
                :to="item.location"
                target="_blank"
                class="text-neutral-600 italic"
              >
                Klik Link Lokasi / Meeting
              </NuxtLink>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="target in item.fors"
              :key="target.id"
              variant="subtle"
              color="neutral"
              size="xs"
              class="rounded-full"
            >
              {{ target.name }}
            </UBadge>
          </div>
        </template>
      </UCard>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-neutral-800 rounded-3xl"
    >
      <UIcon
        name="i-lucide-calendar-x"
        class="w-12 h-12 text-neutral-700 mb-4"
      />
      <p class="text-neutral-500 font-medium">
        Tidak ada agenda yang ditemukan.
      </p>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'landingpage'
})

interface AgendaItem {
  id: string
  title: string
  location: string
  description: string
  start_date: string
  start_time: string
  fors: { id: string; name: string }[]
}

const searchQuery = ref('')
const selectedCategory = ref('Semua')
const categories = ['Semua', 'RT 01', 'RT 04', 'Umum']

const pageData = reactive({
  title: 'Agenda dan Kegiatan',
  subtitle:
    'Jungle Toon Bukit Wahid Regency Manyaran Semarang Barat, Kota Semarang.'
})

// 5 Dummy Data
const events = ref<AgendaItem[]>([
  {
    id: '1',
    title: 'Pertemuan Rutin RT 04',
    location: 'Rumah Bapak Ketua RT 04 (Blok A-12)',
    description:
      'Membahas persiapan fogging lingkungan dan iuran sampah bulanan.',
    start_date: '2026-02-25',
    start_time: '19:30',
    fors: [{ id: '1', name: 'RT 04' }]
  },
  {
    id: '2',
    title: 'Rapat Koordinasi Pengurus RW',
    location: 'https://zoom.us/j/987654321',
    description:
      'Finalisasi program kerja tahunan dan laporan keuangan koperasi.',
    start_date: '2026-03-01',
    start_time: '20:00',
    fors: [{ id: '4', name: 'Semua Pengurus' }]
  },
  {
    id: '3',
    title: 'Kerja Bakti Massal',
    location: 'Area Taman Utama Bukit Wahid',
    description:
      'Pembersihan selokan menjelang musim hujan dan penanaman pohon.',
    start_date: '2026-03-05',
    start_time: '07:00',
    fors: [
      { id: '5', name: 'Umum' },
      { id: '1', name: 'RT 01' }
    ]
  },
  {
    id: '4',
    title: 'Sosialisasi Keamanan Digital',
    location: 'https://meet.google.com/abc-defg-hij',
    description: 'Edukasi keamanan data warga dan penggunaan aplikasi RW.',
    start_date: '2026-03-10',
    start_time: '19:00',
    fors: [{ id: '5', name: 'Umum' }]
  },
  {
    id: '5',
    title: 'Posyandu Balita & Lansia',
    location: 'Balai Warga RW 11',
    description:
      'Pemeriksaan kesehatan gratis rutin bulanan dan pemberian vitamin.',
    start_date: '2026-03-15',
    start_time: '08:30',
    fors: [{ id: '5', name: 'Umum' }]
  }
])

// Filter Logic
const filteredAgendas = computed(() => {
  return events.value.filter((item) => {
    const sQuery = searchQuery.value.toLowerCase().trim()

    // Filter by Search
    const matchSearch =
      item.title.toLowerCase().includes(sQuery) ||
      item.description.toLowerCase().includes(sQuery)

    // Filter by Category (Target Audience / Fors)
    const matchCategory =
      selectedCategory.value === 'Semua' ||
      item.fors.some((f) => f.name === selectedCategory.value)

    return matchSearch && matchCategory
  })
})

// Helpers
const isLink = (str: string) => {
  return str.startsWith('http') || str.startsWith('https')
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>
