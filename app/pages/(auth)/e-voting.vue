<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

// --- STATE ---
const loading = ref(false)
const isOpen = ref(false)
const dataVoting = ref<any[]>([])
const selectedDetail = ref<any>(null)

// Filter & Dropdown State
const selectedStatus = ref('') // Default kosong untuk 'Semua Status'
const statusOptions = ref<Option[]>([{ key: null, label: 'Semua Status' }])

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

// --- TABLE COLUMNS ---
const votingTable = [
  { accessorKey: 'title', header: 'Judul Voting' },
  { accessorKey: 'author.name', header: 'Pembuat' },
  { accessorKey: 'start_date', header: 'Mulai' },
  { accessorKey: 'end_date', header: 'Batas Akhir' },
  { accessorKey: 'action', header: 'Aksi' }
]

// --- ACTIONS ---

// Fetch Options untuk Dropdown
const getStatusOptions = async () => {
  try {
    const res = await useApi<any>('/dropdown/complaint-status')
    if (res.status === 1) {
      statusOptions.value = [
        { key: null, label: 'Semua Status' },
        ...(res.data || [])
      ]
    }
  } catch (err) {
    console.error('Failed to fetch status options:', err)
  }
}

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/voting', {
      params: {
        page: pagination.value.current_page,
        per_page: pagination.value.per_page,
        status: selectedStatus.value // Dikirim sebagai param
      }
    })
    if (res.status === 1) {
      dataVoting.value = res.data
      pagination.value = { ...res.pagination }
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

// Reset pagination ke hal 1 saat filter berubah
const handleFilterChange = () => {
  pagination.value.current_page = 1
  getData()
}

const openDetail = (row: any) => {
  selectedDetail.value = row
  isOpen.value = true
}

const getStatusColor = (start: string, end: string) => {
  const now = new Date()
  const startDate = new Date(start)
  const endDate = new Date(end)

  if (now < startDate) return 'warning'
  if (now > endDate) return 'error'
  return 'success'
}

onMounted(() => {
  getStatusOptions()
  getData()
})
</script>

<template>
  <div class="space-y-4">
    <ConfirmDialog />

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

    <UTable :data="dataVoting" :columns="votingTable" :loading="loading">
      <template #title-cell="{ row }">
        <div class="font-medium text-gray-900">{{ row.original.title }}</div>
        <div class="text-xs text-gray-400 truncate max-w-xs">
          {{ row.original.description }}
        </div>
      </template>

      <template #start_date-cell="{ row }">
        <div class="text-sm">
          {{ formatDateTime(row.original.start_date) }}
        </div>
      </template>

      <template #end_date-cell="{ row }">
        <div
          class="text-sm font-semibold"
          :class="`text-${getStatusColor(
            row.original.start_date,
            row.original.end_date
          )}-500`"
        >
          {{ formatDateTime(row.original.end_date) }}
        </div>
        <div class="text-xs text-gray-400">{{ row.original.end_time }} WIB</div>
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

    <div class="flex justify-end border-t border-gray-100 pt-4 px-4">
      <UPagination
        v-model:page="pagination.current_page"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        @update:page="getData"
      />
    </div>

    <UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-2xl' }">
      <template #header>
        <div class="flex flex-col">
          <span class="text-xs text-gray-400 uppercase tracking-wider font-bold"
            >Detail Voting</span
          >
          <span class="text-lg font-bold">{{ selectedDetail?.title }}</span>
        </div>
      </template>
      <template #body>
        <div v-if="selectedDetail" class="space-y-6">
          <div
            class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100"
          >
            <div>
              <p class="text-[10px] text-gray-400 uppercase font-bold">
                Dibuat Oleh
              </p>
              <p class="text-sm font-medium">
                {{ selectedDetail.author.name }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-gray-400 uppercase font-bold">
                Target
              </p>
              <p class="text-sm font-medium">
                {{ selectedDetail.for.length }} Grup
              </p>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end w-full">
          <UButton color="neutral" variant="ghost" @click="isOpen = false"
            >Tutup</UButton
          >
        </div>
      </template>
    </UModal>
  </div>
</template>
