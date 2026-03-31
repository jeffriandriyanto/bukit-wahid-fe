<script setup lang="ts">
import { perPageLimit } from '~/const/utils'
import { fileUploadFinance } from '~/services/files'

definePageMeta({
  middleware: ['auth']
})

// --- COMPOSABLES ---
const { dropdownRT, getDropdownRT } = useApiDropdown()
const { reveal: confirm } = useConfirmService()
const toast = useToast()

// --- STATE ---
const selectedRT = ref()
const loading = ref(false)
const loadingExcel = ref(false)
const publishing = ref(false)
const dataFinancialStatements = ref<any[]>([])

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

// --- TABLE COLUMNS ---
const columnsFinancialStatements = [
  { accessorKey: 'label', header: 'Unit / Kavling' },
  { accessorKey: 'pic_name', header: 'Nama Penghuni' },
  { accessorKey: 'pam_before', header: 'Meter Awal' },
  { accessorKey: 'pam_after', header: 'Meter Akhir' },
  { accessorKey: 'pam_qty', header: 'Penggunaan (m³)' }
]

// --- API ACTIONS ---
const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/finance/pdam', {
      params: {
        rt: selectedRT.value,
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

const publishBill = async () => {
  const isConfirmed = await confirm({
    title: 'Publish Tagihan',
    description:
      'Apakah Anda yakin ingin mem-publish seluruh tagihan ini? Data yang sudah di-publish tidak dapat diubah lagi.',
    confirmLabel: 'Ya, Publish',
    cancelLabel: 'Batal',
    color: 'primary'
  })

  if (!isConfirmed) return

  publishing.value = true
  try {
    const res = await useApi<any>('/finance/pdam', {
      method: 'POST'
    })

    if (res.status === 1) {
      toast.add({ title: 'Tagihan berhasil di-publish', color: 'success' })
      navigateTo('/bill/report')
    } else {
      throw new Error(res.message || 'Gagal mem-publish tagihan')
    }
  } catch (err: any) {
    toast.add({
      title: err.message || 'Terjadi kesalahan sistem',
      color: 'error'
    })
  } finally {
    publishing.value = false
  }
}

// --- EXCEL ACTIONS ---
const excelInput = ref<HTMLInputElement | null>(null)

const downloadTemplateHandler = () => {
  const config = useRuntimeConfig()
  const url = `${config.public.baseUrl}finance/pdam/file`
  window.open(url, '_blank')
}

const triggerExcelUpload = () => excelInput.value?.click()

const handleExcelChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    loadingExcel.value = true
    const res = await fileUploadFinance(file)
    if (res.status === 1) {
      toast.add({ title: 'Data berhasil diunggah', color: 'success' })
      getData()
    }
  } catch (err: any) {
    toast.add({
      title: err?.message || 'Gagal mengunggah data',
      color: 'error'
    })
  } finally {
    loadingExcel.value = false
    if (excelInput.value) excelInput.value.value = ''
  }
}

// --- UTILS & HANDLERS ---
const formatNumber = (val: number) => {
  return new Intl.NumberFormat('id-ID').format(val)
}

const handlePageChange = (page: number) => {
  pagination.value.current_page = page
  getData()
}

watch(() => pagination.value.per_page, () => {
  pagination.value.current_page = 1
  getData()
})

onMounted(() => {
  getDropdownRT()
  getData()
})
</script>

<template>
  <div class="space-y-4">
    <ConfirmDialog />

    <input
      ref="excelInput"
      type="file"
      accept=".xlsx, .xls"
      class="hidden"
      @change="handleExcelChange"
    />

    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
    >
      <div class="flex items-center">
        <UIcon
          name="mdi:arrow-left"
          class="mr-2 cursor-pointer"
          @click="navigateTo('/bill/report')"
        />

        <USelectMenu
          v-model="selectedRT"
          placeholder="Filter RT"
          :items="dropdownRT"
          value-key="key"
          label-key="label"
          searchable
          clear
          class="w-full md:w-48"
          @change="
            () => {
              pagination.current_page = 1
              getData()
            }
          "
        />
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          color="neutral"
          variant="subtle"
          icon="i-mdi-download"
          @click="downloadTemplateHandler"
        >
          Template
        </UButton>

        <UButton
          color="neutral"
          variant="subtle"
          icon="i-mdi-upload"
          :loading="loadingExcel"
          @click="triggerExcelUpload"
        >
          Upload Data
        </UButton>

        <UButton
          color="primary"
          icon="i-mdi-publish"
          :loading="publishing"
          @click="publishBill"
        >
          Publish
        </UButton>
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
          th: 'text-xs uppercase tracking-wider'
        }"
      >
        <template #label-cell="{ row }">
          <UBadge variant="subtle" color="primary" size="sm" class="font-bold">
            {{ row.original.label }}
          </UBadge>
        </template>

        <template #pam_before-cell="{ row }">
          <span class="font-mono text-gray-500">{{
            formatNumber(row.original.pam_before)
          }}</span>
        </template>

        <template #pam_after-cell="{ row }">
          <span class="font-mono text-gray-900 font-semibold">{{
            formatNumber(row.original.pam_after)
          }}</span>
        </template>

        <template #pam_qty-cell="{ row }">
          <div class="flex items-center gap-1">
            <span class="font-bold text-primary-600">{{
              row.original.pam_qty
            }}</span>
            <span class="text-[10px] text-gray-400">m³</span>
          </div>
        </template>

        <template #action-cell>
          <span class="text-xs text-gray-400">-</span>
        </template>
      </UTable>
    </div>

    <div class="flex justify-between">
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
        :model-value="pagination.current_page"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        @update:page="handlePageChange"
      />
    </div>
  </div>
</template>
