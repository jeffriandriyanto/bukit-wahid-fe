<script setup lang="ts">
import { perPageLimit } from '~/const/utils'

definePageMeta({ middleware: ['auth'] })

// --- STATE ---
const dataPetty = ref([])
const loading = ref(false)
const isOpen = ref(false)
const selectedDetail = ref<any>(null)

// Filter States
const searchQuery = ref('')
const selectedStatus = ref(null)
const statusOptions = ref<any[]>([{ key: null, label: 'Semua Status' }])

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

// --- TABLE COLUMNS ---
const pettyTable = [
  { accessorKey: 'date', header: 'Tanggal' },
  { accessorKey: 'coa', header: 'Kategori / Tag' },
  { accessorKey: 'description', header: 'Deskripsi' },
  { accessorKey: 'amount', header: 'Nominal' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'action', header: 'Aksi' }
]

// --- ACTIONS ---

// Fetch Dropdown Options
const getOptions = async () => {
  try {
    const res = await useApi<any>('/dropdown/petty-status')
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

// Fetch List Data
const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/finance/petty-cash', {
      params: {
        page: pagination.value.current_page,
        limit: pagination.value.per_page,
        search: searchQuery.value,
        status: selectedStatus.value ?? ''
      }
    })

    if (res.status === 1) {
      dataPetty.value = res.data
      pagination.value = { ...res.pagination }
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

// Fetch Detail Data
const getDetail = async (id: string) => {
  try {
    const res = await useApi<any>(`/finance/petty-cash/${id}`)
    if (res.status === 1) {
      selectedDetail.value = res.data
      isOpen.value = true
    }
  } catch (err) {
    console.error('Detail fetch error:', err)
  }
}

const handleFilterChange = () => {
  pagination.value.current_page = 1
  getData()
}

// --- HELPERS ---
const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approve':
      return 'success'
    case 'approve_treasurer':
      return 'info'
    case 'reject':
      return 'error'
    case 'open':
      return 'warning'
    default:
      return 'neutral'
  }
}

const getStatusLabel = (status: string) => {
  const found = statusOptions.value.find((opt) => opt.key === status)
  return found ? found.label : status
}

watch(
  () => pagination.value.per_page,
  () => {
    pagination.value.current_page = 1
    getData()
  }
)

onMounted(() => {
  getOptions()
  getData()
})
</script>

<template>
  <div class="space-y-4">
    <ConfirmDialog />

    <SharedHeaderBg>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary-50 rounded-lg">
          <UIcon name="i-lucide-wallet" class="w-5 h-5 text-primary-600" />
        </div>
        <h2 class="text-lg font-bold text-gray-900">Petty Cash (Kas Kecil)</h2>
      </div>

      <div class="flex gap-4">
        <div class="w-72">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari Tag atau Deskripsi..."
            @keyup.enter="handleFilterChange"
          />
        </div>

        <div v-if="statusOptions.length > 0" class="w-64">
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
      </div>
    </SharedHeaderBg>

    <div
      class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <UTable :data="dataPetty" :columns="pettyTable" :loading="loading">
        <template #date-cell="{ row }">
          <div class="text-sm font-medium">
            {{ formatDate(row.original.date) }}
          </div>
          <div class="text-[10px] text-gray-400">
            Dibuat: {{ formatDateTime(row.original.created_at) }}
          </div>
        </template>

        <template #coa-cell="{ row }">
          <div class="font-bold text-primary-700">#{{ row.original.tag }}</div>
          <div class="text-xs text-gray-500">{{ row.original.coa?.name }}</div>
        </template>

        <template #description-cell="{ row }">
          <div class="truncate max-w-xs text-sm">
            {{ row.original.description }}
          </div>
        </template>

        <template #amount-cell="{ row }">
          <div
            v-if="parseFloat(row.original.credit) > 0"
            class="text-green-600 font-semibold"
          >
            + {{ formatCurrency(row.original.credit) }}
          </div>
          <div
            v-else-if="parseFloat(row.original.debit) > 0"
            class="text-red-600 font-semibold"
          >
            - {{ formatCurrency(row.original.debit) }}
          </div>
          <div v-else class="text-gray-400">Rp 0</div>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="getStatusColor(row.original.status)"
            variant="subtle"
            class="capitalize"
          >
            {{ getStatusLabel(row.original.status) }}
          </UBadge>
        </template>

        <template #action-cell="{ row }">
          <UButton
            icon="i-heroicons-eye"
            variant="ghost"
            color="neutral"
            @click="getDetail(row.original.id)"
          />
        </template>
      </UTable>
    </div>

    <div class="flex justify-between items-center">
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <span>Tampilkan</span>
        <USelect
          v-model.number="pagination.per_page"
          :items="perPageLimit"
          value-attribute="value"
          option-attribute="label"
          class="w-24"
        />
      </div>

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
          <div>
            <h3 class="text-lg font-bold">Detail Petty Cash</h3>
            <p class="text-xs text-gray-500">ID: {{ selectedDetail?.id }}</p>
          </div>
          <UBadge :color="getStatusColor(selectedDetail?.status)">
            {{ getStatusLabel(selectedDetail?.status) }}
          </UBadge>
        </div>
      </template>

      <template #body>
        <div v-if="selectedDetail" class="space-y-6">
          <div
            class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100"
          >
            <div>
              <div class="text-[10px] text-gray-500 uppercase font-bold">
                Pengaju
              </div>
              <p class="font-medium">{{ selectedDetail.user.name }}</p>
              <p class="text-xs text-gray-400">
                {{ selectedDetail.user.username }}
              </p>
            </div>
            <div>
              <div class="text-[10px] text-gray-500 uppercase font-bold">
                COA / Tag
              </div>
              <p class="font-medium text-primary-700">
                #{{ selectedDetail.tag }}
              </p>
              <p class="text-xs text-gray-600">{{ selectedDetail.coa.name }}</p>
            </div>
            <div>
              <div class="text-[10px] text-gray-500 uppercase font-bold">
                Nominal
              </div>
              <p
                :class="[
                  'text-lg font-bold',
                  parseFloat(selectedDetail.credit) > 0
                    ? 'text-green-600'
                    : 'text-red-600'
                ]"
              >
                {{
                  parseFloat(selectedDetail.credit) > 0
                    ? formatCurrency(selectedDetail.credit)
                    : formatCurrency(selectedDetail.debit)
                }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p class="text-sm font-bold mb-2 text-gray-900">
                Deskripsi / Keperluan:
              </p>
              <div
                class="p-3 bg-white border rounded-lg text-sm text-gray-700 italic leading-relaxed"
              >
                "{{ selectedDetail.description }}"
              </div>
              <div class="mt-4">
                <p class="text-xs text-gray-500 mb-2">Lampiran Bukti:</p>
                <div
                  class="p-3 border-2 border-dashed rounded-lg flex items-center gap-3"
                >
                  <UIcon
                    name="i-heroicons-document-text"
                    class="w-8 h-8 text-gray-400"
                  />
                  <div class="flex-1 overflow-hidden">
                    <p class="text-xs font-medium truncate">
                      {{ selectedDetail.proof }}
                    </p>
                  </div>
                  <UButton size="xs" color="neutral" variant="subtle"
                    >Lihat</UButton
                  >
                </div>
              </div>
            </div>

            <div>
              <p class="text-sm font-bold mb-3 text-gray-900">
                Riwayat Persetujuan:
              </p>
              <div
                class="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent"
              >
                <div
                  v-for="history in selectedDetail.histories"
                  :key="history.id"
                  class="relative flex items-start gap-4"
                >
                  <div class="absolute left-0 mt-1">
                    <div
                      :class="[
                        'flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow-sm',
                        history.status === 'approve'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      ]"
                    >
                      <UIcon
                        :name="
                          history.status === 'approve'
                            ? 'i-heroicons-check'
                            : 'i-heroicons-x-mark'
                        "
                        class="w-5 h-5 text-white"
                      />
                    </div>
                  </div>
                  <div
                    class="ml-12 p-3 bg-gray-50 rounded-lg border border-gray-100 flex-1"
                  >
                    <div class="flex justify-between items-center mb-1">
                      <span class="text-xs font-bold">{{
                        history.user.name
                      }}</span>
                      <span class="text-[9px] text-gray-400">{{
                        formatDateTime(history.created_at)
                      }}</span>
                    </div>
                    <div class="flex items-center gap-2 mb-2">
                      <UBadge
                        size="xs"
                        variant="outline"
                        class="text-[9px] uppercase"
                      >
                        {{ history.action_by }}
                      </UBadge>
                    </div>
                    <p class="text-xs text-gray-600 italic">
                      "{{ history.description }}"
                    </p>
                  </div>
                </div>

                <div
                  v-if="!selectedDetail.histories?.length"
                  class="text-center py-4 text-gray-400 text-sm"
                >
                  Belum ada riwayat tindakan.
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end w-full">
          <UButton
            label="Tutup"
            color="neutral"
            variant="ghost"
            @click="isOpen = false"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
