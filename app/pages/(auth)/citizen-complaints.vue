<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

// --- STATE ---
const dataSubmission = ref([])
const loading = ref(false)
const isOpen = ref(false)
const selectedDetail = ref<any>(null)

// Filter States
const selectedStatus = ref(null)
const selectedCategory = ref(null)
const statusOptions = ref<any[]>([{ key: null, label: 'Semua Status' }])
const categoryOptions = ref<any[]>([{ key: null, label: 'Semua Kategori' }])

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

// --- TABLE COLUMNS ---
const submissionTable = [
  { accessorKey: 'description', header: 'Deskripsi' },
  { accessorKey: 'author.name', header: 'Pembuat' },
  { accessorKey: 'created_at', header: 'Tanggal' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'action', header: 'Aksi' }
]

// --- ACTIONS ---

// Fetch Dropdown Options
const getOptions = async () => {
  try {
    const [statusRes, categoryRes] = await Promise.all([
      useApi<any>('/dropdown/complaint-status'),
      useApi<any>('/dropdown/complaint-category')
    ])

    if (statusRes.status === 1) {
      statusOptions.value = [
        { key: null, label: 'Semua Status' },
        ...(statusRes.data || [])
      ]
    }
    if (categoryRes.status === 1) {
      categoryOptions.value = [
        { key: null, label: 'Semua Kategori' },
        ...(categoryRes.data || [])
      ]
    }
  } catch (err) {
    console.error('Failed to fetch dropdown options:', err)
  }
}

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/complaint', {
      params: {
        page: pagination.value.current_page,
        per_page: pagination.value.per_page,
        status: selectedStatus.value ?? '', // Handle null to empty string for API
        category: selectedCategory.value ?? ''
      }
    })

    if (res.status === 1) {
      dataSubmission.value = res.data
      pagination.value = { ...res.pagination }
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  pagination.value.current_page = 1
  getData()
}

const openDetail = (detail: any) => {
  selectedDetail.value = detail
  isOpen.value = true
}

// --- HELPERS ---
const isImage = (url: string) => {
  if (!url) return false
  const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  const ext = url.split('.').pop()?.toLowerCase()
  return extensions.includes(ext || '')
}

const openInMaps = (lat: string, lng: string) => {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  window.open(url, '_blank')
}

const categoryMap: Record<string, string> = {
  security: 'Keamanan',
  clean: 'Kebersihan',
  panic: 'Panic Button',
  other: 'Lainnya'
}

// Fungsi helper untuk dipanggil di template
const getCategoryLabel = (key: string) => {
  return categoryMap[key] || key || '-'
}

onMounted(() => {
  getOptions()
  getData()
})
</script>

<template>
  <div class="p-4 space-y-4">
    <ConfirmDialog />

    <div class="flex flex-wrap gap-4 items-end">
      <div v-if="statusOptions.length > 0" class="w-64">
        <label class="text-[10px] font-bold text-gray-400 uppercase mb-1 block">
          Filter Status
        </label>
        <USelect
          :key="statusOptions.length"
          v-model="selectedStatus"
          :items="statusOptions"
          label-key="label"
          value-key="key"
          placeholder="Pilih Status"
          @update:model-value="handleFilterChange"
        />
      </div>

      <div v-if="categoryOptions.length > 0" class="w-64">
        <label class="text-[10px] font-bold text-gray-400 uppercase mb-1 block">
          Filter Kategori
        </label>
        <USelect
          :key="categoryOptions.length"
          v-model="selectedCategory"
          :items="categoryOptions"
          label-key="label"
          value-key="key"
          placeholder="Pilih Kategori"
          @update:model-value="handleFilterChange"
        />
      </div>
    </div>

    <UTable
      :data="dataSubmission"
      :columns="submissionTable"
      :loading="loading"
    >
      <template #description-cell="{ row }">
        <div class="truncate max-w-56 font-medium">
          {{ row.original.description }}
        </div>
        <div class="text-xs text-gray-400 italic">
          {{ getCategoryLabel(row.original.category) }}
        </div>
      </template>

      <template #created_at-cell="{ row }">
        <div class="text-sm">{{ formatDateTime(row.original.created_at) }}</div>
      </template>

      <template #status-cell="{ row }">
        <UBadge
          v-if="row.original.status === 'progress'"
          color="warning"
          variant="subtle"
          >Sedang ditangani</UBadge
        >
        <UBadge
          v-else-if="row.original.status === 'closed'"
          color="success"
          variant="subtle"
          >Selesai</UBadge
        >
        <UBadge
          v-else-if="row.original.status === 'open'"
          color="error"
          variant="subtle"
          >Perlu Tindakan</UBadge
        >
      </template>

      <template #action-cell="{ row }">
        <UButton
          icon="i-heroicons-eye"
          variant="ghost"
          color="neutral"
          @click="openDetail(row.original)"
        />
      </template>
    </UTable>

    <div class="flex justify-end border-t border-gray-200 pt-4 px-4">
      <UPagination
        v-model:page="pagination.current_page"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        @update:page="getData"
      />
    </div>

    <UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-4xl' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-lg font-bold">Detail Komplain</h3>
          <UBadge v-if="selectedDetail?.status === 'progress'" color="warning"
            >Sedang ditangani</UBadge
          >
          <UBadge
            v-else-if="selectedDetail?.status === 'closed'"
            color="success"
            >Selesai</UBadge
          >
          <UBadge v-else-if="selectedDetail?.status === 'open'" color="error"
            >Perlu Tindakan</UBadge
          >
        </div>
      </template>

      <template #body>
        <div v-if="selectedDetail" class="space-y-6">
          <div
            class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100"
          >
            <div>
              <div class="text-[10px] text-gray-500 uppercase font-bold">
                Pelapor
              </div>
              <p class="font-medium">{{ selectedDetail.author.name }}</p>
            </div>
            <div>
              <div class="text-[10px] text-gray-500 uppercase font-bold">
                Kategori
              </div>
              <p class="font-medium capitalize">
                {{ selectedDetail.category }}
              </p>
            </div>
            <div>
              <div class="text-[10px] text-gray-500 uppercase font-bold">
                Waktu Kejadian
              </div>
              <p class="font-medium">
                {{ formatDateTime(selectedDetail.created_at) }}
              </p>
            </div>
            <div>
              <div class="text-[10px] text-gray-500 uppercase font-bold">
                Lokasi
              </div>
              <UButton
                icon="i-heroicons-map-pin"
                size="xs"
                variant="solid"
                color="neutral"
                class="mt-1"
                @click="
                  openInMaps(selectedDetail.latitude, selectedDetail.longitude)
                "
              >
                Buka Google Maps
              </UButton>
            </div>
          </div>

          <div>
            <p class="text-sm font-bold mb-1">Deskripsi Laporan:</p>
            <p class="text-gray-700 text-sm leading-relaxed">
              {{ selectedDetail.description }}
            </p>

            <div class="mt-4">
              <div class="text-xs text-gray-500 mb-2">Lampiran Laporan:</div>
              <div
                v-if="isImage(selectedDetail.file)"
                class="max-w-sm rounded-lg overflow-hidden border"
              >
                <img
                  :src="selectedDetail.file"
                  class="w-full h-auto object-cover"
                />
              </div>
              <UButton
                v-else-if="selectedDetail.file"
                icon="i-heroicons-document-arrow-down"
                color="neutral"
                label="Download Dokumen"
                :to="selectedDetail.file"
                target="_blank"
              />
            </div>
          </div>

          <UDivider label="Riwayat Penanganan" label-placement="center" />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="(action, index) in selectedDetail.actions"
              :key="index"
              class="flex flex-col p-4 border rounded-lg bg-white shadow-sm"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="font-bold text-sm">{{ action.officer.name }}</span>
                <span class="text-[10px] text-gray-400">{{
                  formatDateTime(action.created_at)
                }}</span>
              </div>
              <div class="mb-2">
                <UBadge
                  v-if="action?.status === 'progress'"
                  size="xs"
                  color="warning"
                  >Sedang ditangani</UBadge
                >
                <UBadge
                  v-else-if="action?.status === 'closed'"
                  color="success"
                  size="xs"
                  >Selesai</UBadge
                >
                <UBadge
                  v-else-if="action?.status === 'open'"
                  size="xs"
                  color="error"
                  >Perlu Tindakan</UBadge
                >
              </div>
              <p class="text-xs text-gray-600 flex-1 italic">
                "{{ action.description }}"
              </p>

              <div v-if="action.file" class="mt-3 pt-3 border-t border-gray-50">
                <div
                  v-if="isImage(action.file)"
                  class="w-full h-32 rounded-md overflow-hidden border"
                >
                  <img
                    :src="action.file"
                    class="w-full h-full object-cover cursor-pointer"
                    @click="window.open(action.file, '_blank')"
                  />
                </div>
                <UButton
                  v-else
                  size="xs"
                  color="neutral"
                  variant="outline"
                  icon="i-heroicons-paper-clip"
                  :to="action.file"
                  target="_blank"
                >
                  Lihat Dokumen
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
