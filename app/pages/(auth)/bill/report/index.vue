<script setup lang="ts">
import { watchWithFilter, debounceFilter } from '@vueuse/core'
const { dropdownRT, getDropdownRT } = useApiDropdown()

definePageMeta({
  middleware: ['auth']
})

// --- STATE ---
const search = ref('')
const selectedRT = ref()
const loading = ref(false)
const dataFinancialStatements = ref<any[]>([])

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

// --- TABLE COLUMNS ---
// Disesuaikan dengan payload dari /finance/bill
const columnsFinancialStatements = [
  { accessorKey: 'unit', header: 'Unit / Kavling' },
  { accessorKey: 'name', header: 'Nama Penghuni' },
  { accessorKey: 'total_ipl', header: 'Tagihan IPL' },
  { accessorKey: 'total_pam', header: 'Tagihan Air' },
  { accessorKey: 'total_dues', header: 'Iuran Lain' },
  { accessorKey: 'total', header: 'Total Tagihan' },
  { accessorKey: 'action', header: 'Aksi' }
]

// --- API ACTIONS ---
const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/finance/bill', {
      params: {
        rt: selectedRT.value,
        search: search.value,
        page: pagination.value.current_page,
        limit: pagination.value.per_page
      },
      method: 'GET'
    })

    if (res.status === 1) {
      dataFinancialStatements.value = res.data
      pagination.value = { ...res.pagination }
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

const showDetailHandler = async (data: any) => {
  navigateTo(`/bill/report/${data.id}?name=${encodeURIComponent(data.name)}`)
}
// --- UTILS & HANDLERS ---
const formatCurrency = (val: string | number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(val))
}

const handlePageChange = (page: number) => {
  pagination.value.current_page = page
  getData()
}

const navigateToTagihanDetail = () => {
  navigateTo('/bill/pdam')
}

watchWithFilter(
  search,
  () => {
    pagination.value.current_page = 1
    getData()
  },
  {
    eventFilter: debounceFilter(1000)
  }
)

onMounted(() => {
  getDropdownRT()
  getData()
})
</script>

<template>
  <div class="space-y-6">
    <ConfirmDialog />

    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
    >
      <div class="flex space-x-2">
        <USelectMenu
          v-model="selectedRT"
          placeholder="Filter RT"
          :items="dropdownRT"
          value-key="key"
          label-key="label"
          clear
          searchable
          class="w-full md:w-48"
          @change="
            () => {
              pagination.current_page = 1
              getData()
            }
          "
        />

        <UFormField>
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Cari Nama..."
            block
          />
        </UFormField>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          color="primary"
          icon="i-mdi-plus-circle-outline"
          @click="navigateToTagihanDetail"
        >
          Kelola Tagihan Air
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        class="flex items-center gap-4 p-6 border border-success-200 rounded-2xl bg-success-50/50"
      >
        <div class="p-2 flex items-center bg-success-500 rounded-xl text-white">
          <UIcon name="i-material-symbols-money-bag" class="size-8" />
        </div>
        <div>
          <div class="text-sm text-success-600 font-medium">
            Total Tagihan Bulan Ini
          </div>
          <div class="font-bold text-2xl text-success-900">Rp 45.200.000</div>
        </div>
      </div>

      <div
        class="flex items-center gap-4 p-6 border border-primary-100 rounded-2xl bg-primary-50/50"
      >
        <div class="p-2 flex items-center bg-primary-500 rounded-xl text-white">
          <UIcon name="i-material-symbols-money-bag-outline" class="size-8" />
        </div>
        <div>
          <div class="text-sm text-primary-600 font-medium">
            Estimasi Revenue Keseluruhan
          </div>
          <div class="font-bold text-2xl text-primary-900">Rp 120.450.000</div>
        </div>
      </div>
    </div>

    <div
      class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <UTable
        :data="dataFinancialStatements"
        :columns="columnsFinancialStatements"
        :loading="loading"
        :ui="{
          thead: 'bg-gray-50/50',
          th: 'text-xs uppercase tracking-wider whitespace-nowrap',
          td: 'whitespace-nowrap'
        }"
      >
        <template #unit-cell="{ row }">
          <UBadge variant="subtle" color="primary" size="sm" class="font-bold">
            {{ row.original.type }} - {{ row.original.kavling }}
          </UBadge>
        </template>

        <template #name-cell="{ row }">
          <span class="font-medium text-gray-900">{{ row.original.name }}</span>
        </template>

        <template #total_ipl-cell="{ row }">
          <span class="font-mono text-gray-600">{{
            formatCurrency(row.original.total_ipl)
          }}</span>
        </template>

        <template #total_pam-cell="{ row }">
          <span class="font-mono text-gray-600">{{
            formatCurrency(row.original.total_pam)
          }}</span>
        </template>

        <template #total_dues-cell="{ row }">
          <span class="font-mono text-gray-600">{{
            formatCurrency(row.original.total_dues)
          }}</span>
        </template>

        <template #total-cell="{ row }">
          <span class="font-mono text-primary-700 font-bold">{{
            formatCurrency(row.original.total)
          }}</span>
        </template>

        <template #action-cell="{ row }">
          <UButton
            icon="i-lucide-eye"
            variant="ghost"
            color="neutral"
            title="Lihat Detail Histori"
            @click="showDetailHandler(row.original)"
          />
        </template>
      </UTable>
    </div>

    <div class="flex justify-end">
      <UPagination
        v-model="pagination.current_page"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        @update:page="handlePageChange"
      />
    </div>
  </div>
</template>
