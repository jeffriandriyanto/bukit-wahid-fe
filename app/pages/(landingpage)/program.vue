<template>
  <UContainer class="py-12 md:py-20 space-y-8">
    <header
      class="text-center text-white p-4 max-w-3xl mx-auto space-y-2 bg-linear-to-r from-primary-600 via-primary-400 to-primary-600 rounded-2xl"
    >
      <h1 class="text-xl md:text-3xl font-black tracking-tight">
        {{ pageData.title }}
      </h1>
      <p class="text-sm">{{ pageData.subtitle }}</p>
    </header>

    <div
      class="flex flex-col md:flex-row gap-4 justify-between items-center p-4"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-bold text-primary-500">{{
          filteredRows.length
        }}</span>
        <span class="text-neutral-400 font-medium">Program Kerja</span>
      </div>

      <div class="flex gap-3 w-full md:w-auto">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Cari program..."
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

    <UTable
      :data="filteredRows"
      :columns="columns"
      :loading="pending"
      :ui="{
        root: 'relative overflow-x-auto',
        thead: 'bg-primary-100',
        td: 'align-top py-6 px-4 text-sm whitespace-normal',
        loading: 'text-sm text-neutral-400 w-6 h-6 text-primary-50'
      }"
    >
      <template #category-data="{ row }">
        <span class="font-bold text-white whitespace-nowrap">{{
          row.original.category
        }}</span>
      </template>

      <template #duration-data="{ row }">
        <UBadge
          variant="subtle"
          color="neutral"
          class="font-mono whitespace-nowrap"
        >
          {{ row.original.duration }}
        </UBadge>
      </template>

      <template #details-data="{ row }">
        <ul
          class="list-disc list-outside ml-4 space-y-2 max-w-sm lg:max-w-md text-neutral-400"
        >
          <li
            v-for="(item, index) in row.original.details"
            :key="index"
            class="leading-relaxed"
          >
            {{ item }}
          </li>
        </ul>
      </template>

      <template #empty-state>
        <div class="flex flex-col items-center justify-center py-10 gap-3">
          <UIcon
            name="i-lucide-database-zap"
            class="w-8 h-8 text-neutral-600"
          />
          <span class="text-sm text-neutral-500"
            >Data program kerja tidak ditemukan.</span
          >
        </div>
      </template>
    </UTable>
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'landingpage'
})

// State management
const searchQuery = ref('')
const selectedCategory = ref('Semua')
const categories = ['Semua', 'Jangka Pendek', 'Jangka Panjang']
const pending = ref(false) // Simulasi loading state untuk backend

const pageData = reactive({
  title: 'Program Kerja',
  subtitle:
    'Jungle Toon Bukit Wahid Regency Manyaran Semarang Barat, Kota Semarang.'
})

// Column Definition sesuai dokumentasi Nuxt UI
const columns = [
  { accessorKey: 'category', header: 'Kategori', sortable: true },
  { accessorKey: 'no', header: 'No' },
  { accessorKey: 'work_program', header: 'Program Kerja' },
  { accessorKey: 'duration', header: 'Waktu', sortable: true },
  { accessorKey: 'pic', header: 'PJ' },
  { accessorKey: 'details', header: 'Keterangan' }
]

// Data Utama
const programs = ref([
  {
    id: 1,
    category: 'Jangka Pendek',
    no: 1,
    work_program: 'Jangka Pendek',
    duration: '1 Tahun',
    pic: 'Ketua RW',
    details: [
      'Konsolidasi organisasi ke RW an dan EM.',
      'Penyamaan persepsi, konsensus dan rekonsiliasi.',
      'Penyusunan Pedoman Rukun Warga XI BWR',
      'Penggunaan SIM ke RW dan RT an',
      'Fasilitasi Rapat Anggota Koperasi',
      'Meminta pengelolaan'
    ]
  },
  {
    id: 2,
    category: 'Jangka Panjang',
    no: 1,
    work_program: 'Jangka Panjang',
    duration: '2 Tahun',
    pic: 'Ketua RW',
    details: [
      'Pemberdayaan Unit Koperasi agar profit meningkat.',
      'Perencanaan kegiatan-kegiatan yang merukunkan warga.',
      'Tercapai Standar Pelayanan EM 1x24 jam.',
      'Solusi penyelesaian tunggakan IPL.',
      'Terbangunnya Apotik hidup untuk semua RT.'
    ]
  }
])

// Filter Logic
// Perbaikan Logic Filter yang lebih aman
const filteredRows = computed(() => {
  // 1. Pastikan kita punya data dasar
  if (!programs.value) return []

  return programs.value.filter((p) => {
    // 2. Normalisasi pencarian (handling null/undefined)
    const query = (searchQuery.value || '').toLowerCase()

    // Search logic: Cek judul program ATAU isi detail
    const nameMatch = p.work_program?.toLowerCase().includes(query)
    const detailMatch = p.details?.some((d) => d.toLowerCase().includes(query))
    const isVisibleBySearch = nameMatch || detailMatch

    // 3. Category logic
    const isVisibleByCategory =
      selectedCategory.value === 'Semua' ||
      p.category === selectedCategory.value

    return isVisibleBySearch && isVisibleByCategory
  })
})
</script>

<style scoped>
/* Scoped style untuk memastikan rendering list di dalam sel tabel */
:deep(.list-disc) {
  list-style-type: disc !important;
}
</style>
