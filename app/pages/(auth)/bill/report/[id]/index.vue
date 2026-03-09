<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { fileUpload } from '~/services/files'

const toast = useToast()
const route = useRoute()
const userId = route.params.id
const userName = route.query.name || 'Detail Penghuni'

// --- STATE ---
const UCheckbox = resolveComponent('UCheckbox')
const loading = ref(false)
const detailData = ref<any[]>([])
const filterType = ref('Semua')
const filterMonth = ref()

// State untuk Modal & Seleksi (Nuxt UI v3 Style)
const isOpen = ref(false)
const rowSelection = ref({}) // State untuk v-model:row-selection (index-based)
const targetBills = ref<any[]>([]) // Menampung bill yang akan dibayar di dalam modal

const evidenceFile = ref(null)
const tableRef = useTemplateRef('table')

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

// Schema Zod
const BillFormSchema = z.object({
  nominal: z.number().min(1, 'Nominal wajib diisi'),
  evidence: z.string().min(1, 'Bukti bayar wajib diunggah')
})

type BillFormSchema = z.infer<typeof BillFormSchema>

const form = reactive({
  nominal: 0,
  evidence: ''
})

// --- TABLE COLUMNS ---
const columns = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'aria-label': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        // Hanya munculkan checkbox jika belum lunas
        disabled: row.original.status !== 'unpaid',
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          row.toggleSelected(!!value),
        'aria-label': 'Select row'
      })
  },
  { accessorKey: 'category', header: 'Tipe' },
  { accessorKey: 'bill_date', header: 'Periode' },
  { accessorKey: 'qty', header: 'Qty' },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'amount', header: 'Tagihan' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'payment_date', header: 'Tanggal Bayar' },
  { accessorKey: 'payment_type', header: 'Pembayaran' },
  { accessorKey: 'action', header: 'Action' }
]

// --- API ACTIONS ---
const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await useApi<any>(`/finance/bill/${userId}`, {
      params: {
        page: pagination.value.current_page,
        limit: pagination.value.per_page
      },
      method: 'GET'
    })
    if (res.status === 1) {
      detailData.value = res.data
      pagination.value = {
        ...res.pagination
      }
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

const saveBill = async (event: FormSubmitEvent<BillFormSchema>) => {
  try {
    loading.value = true
    let finalImageUrl = form.evidence

    if (evidenceFile.value) {
      const uploadRes = await fileUpload(evidenceFile.value)
      if (uploadRes) finalImageUrl = uploadRes
      else throw new Error('Gagal mengunggah gambar')
    }

    const payload = {
      ...event.data,
      bill_ids: targetBills.value.map((b) => b.id),
      evidence: finalImageUrl,
      change: returnAmount.value
    }

    console.log('Payload Bayar:', payload)

    toast.add({ title: 'Pembayaran Berhasil', color: 'success' })
    isOpen.value = false
    rowSelection.value = {} // Reset seleksi setelah bayar
    fetchDetail()
  } catch (err: any) {
    toast.add({ title: err?.message || 'Error', color: 'error' })
  } finally {
    loading.value = false
  }
}

// --- UTILS & COMPUTED ---
// Mengonversi rowSelection (index) menjadi data object asli
const selectedRowsData: any = computed(() => {
  if (!tableRef.value?.tableApi) return []
  return tableRef.value.tableApi
    .getSelectedRowModel()
    .rows.map((row: any) => row.original)
})

const totalTunggakan = computed(() => {
  return detailData.value
    .filter((i) => i.status === 'unpaid')
    .reduce((acc, i) => acc + Number(i.amount), 0)
})

const totalSelectedAmount = computed(() => {
  return targetBills.value.reduce((acc, i) => acc + Number(i.amount), 0)
})

const returnAmount = computed(() => {
  const diff = form.nominal - totalSelectedAmount.value
  return diff > 0 ? diff : 0
})

// --- HANDLERS ---
const clearImage = () => {
  form.evidence = ''
  evidenceFile.value = null
}

const onFileChange = (file: any) => {
  if (file) {
    evidenceFile.value = file
    form.evidence = URL.createObjectURL(file)
  }
}

const handlePay = (row: any) => {
  targetBills.value = [row]
  form.nominal = Number(row.amount)
  isOpen.value = true
}

const handlePaySelected = () => {
  // Hanya ambil yang statusnya unpaid untuk dibayar
  const unpaidSelection = selectedRowsData.value.filter(
    (r) => r.status === 'unpaid'
  )
  if (unpaidSelection.length === 0) return

  targetBills.value = unpaidSelection
  form.nominal = totalSelectedAmount.value
  isOpen.value = true
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <UButton
          icon="i-lucide-arrow-left"
          variant="ghost"
          color="neutral"
          @click="navigateTo('/bill/report')"
        />
        <div>
          <h1 class="text-xl font-bold text-gray-900">Detail Tagihan</h1>
          <p class="text-gray-500">{{ userName }}</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-sm text-gray-500 font-medium">Total Tunggakan</p>
        <p class="text-2xl font-black text-red-600">
          {{ formatCurrency(totalTunggakan) }}
        </p>
      </div>
    </div>

    <div
      class="flex flex-col md:flex-row items-end md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
    >
      <div class="flex flex-wrap gap-4">
        <div class="flex flex-col gap-1">
          <span class="text-xs font-bold text-gray-400 uppercase"
            >Filter Tipe</span
          >
          <USelect
            v-model="filterType"
            :items="['Semua', 'IPL', 'Air', 'Iuran RW']"
            class="w-48"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-bold text-gray-400 uppercase"
            >Filter by Month</span
          >
          <UInput v-model="filterMonth" type="month" class="w-48" />
        </div>
      </div>

      <UButton
        v-if="selectedRowsData.length > 0"
        color="neutral"
        icon="i-lucide-check-circle"
        :label="`Bayar ${selectedRowsData.length} Tagihan Terpilih`"
        @click="handlePaySelected"
      />
    </div>

    <UModal v-model:open="isOpen">
      <template #header>
        <span class="font-bold">Konfirmasi Pembayaran</span>
      </template>
      <template #body>
        <UForm
          :schema="BillFormSchema"
          :state="form"
          class="space-y-6"
          @submit="saveBill"
        >
          <div
            class="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3"
          >
            <span class="text-xs font-bold text-gray-400 uppercase"
              >Ringkasan</span
            >
            <div
              v-for="bill in targetBills"
              :key="bill.id"
              class="flex justify-between text-sm"
            >
              <span class="text-gray-600"
                >{{ bill.category }} ({{ formatDate(bill.bill_date) }})</span
              >
              <span class="font-semibold">{{
                formatCurrency(bill.amount)
              }}</span>
            </div>
            <div
              class="pt-2 border-t flex justify-between font-bold text-primary-600 text-lg"
            >
              <span>Total Tagihan</span>
              <span>{{ formatCurrency(totalSelectedAmount) }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField name="nominal" label="Uang Diterima">
              <UInput
                v-model.number="form.nominal"
                type="number"
                placeholder="Nominal"
                icon="i-lucide-banknote"
              />
            </UFormField>
            <UFormField label="Kembalian">
              <UInput
                :model-value="formatCurrency(returnAmount)"
                readonly
                class="bg-gray-100"
              />
            </UFormField>
          </div>

          <UFormField name="evidence" label="Bukti Bayar">
            <div class="w-full">
              <div
                v-if="form.evidence"
                class="group relative aspect-video w-full overflow-hidden rounded-lg border"
              >
                <img :src="form.evidence" class="h-full w-full object-cover" />
                <div
                  class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <UButton
                    color="error"
                    variant="solid"
                    icon="i-lucide-trash-2"
                    @click="clearImage"
                  />
                </div>
              </div>
              <UFileUpload
                v-else
                @change="onFileChange"
                accept="image/*"
                :dropzone="true"
                class="aspect-video"
              />
            </div>
          </UFormField>

          <div class="flex justify-between gap-2">
            <UButton variant="ghost" @click="isOpen = false">Batal</UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="loading"
              block
              class="flex-1"
              >Simpan Pembayaran</UButton
            >
          </div>
        </UForm>
      </template>
    </UModal>

    <div
      class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
    >
      <UTable
        ref="table"
        v-model:row-selection="rowSelection"
        :data="detailData"
        :columns="columns"
        :loading="loading"
      >
        <template #category-cell="{ row }">
          <div class="flex flex-col">
            <span class="font-bold text-gray-900">{{
              row.original.category.toUpperCase()
            }}</span>
            <span class="text-[10px] text-gray-400">(Rose B11)</span>
          </div>
        </template>

        <template #amount-cell="{ row }">
          {{ formatCurrency(row.original.amount) }}
        </template>

        <template #status-cell="{ row }">
          <div
            class="px-3 py-1 rounded text-center text-[11px] font-bold uppercase max-w-max mx-auto"
            :class="
              row.original.status === 'unpaid'
                ? 'bg-red-600 text-white'
                : 'bg-green-500 text-white'
            "
          >
            {{ row.original.status === 'unpaid' ? 'Belum Lunas' : 'Lunas' }}
          </div>
        </template>

        <template #action-cell="{ row }">
          <UButton
            v-if="row.original.status === 'unpaid'"
            label="Bayar"
            color="success"
            size="xs"
            class="w-full font-bold uppercase"
            @click="handlePay(row.original)"
          />
          <UButton
            v-else
            label="Bayar"
            color="neutral"
            variant="soft"
            size="xs"
            disabled
            class="w-full opacity-50"
          />
        </template>
      </UTable>
    </div>

    <div class="flex justify-end">
      <UPagination
        v-model:page="pagination.current_page"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        :max="10"
        @update:page="fetchDetail"
      />
    </div>
  </div>
</template>
