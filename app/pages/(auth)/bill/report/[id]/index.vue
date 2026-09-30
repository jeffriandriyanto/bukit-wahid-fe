<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { perPageLimit, mapCategoryLabel } from '~/const/utils'
import { fileUpload } from '~/services/files'
import ReceiptModal from '~/components/receipt/ReceiptModal.vue'

definePageMeta({
  middleware: ['auth']
})

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

const isOpen = ref(false)
const isReceiptOpen = ref(false)
const selectedReceiptBill = ref<any>(null)
const rowSelection = ref({})
const targetBills = ref<any[]>([])

const tableRef = useTemplateRef('table')
const proofFile = ref(null)

const openReceipt = (bill: any) => {
  selectedReceiptBill.value = bill
  isReceiptOpen.value = true
}

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

// Schema Zod
const BillFormSchema = z.object({
  payment_type: z.enum(['cash', 'transfer']).default('cash'),
  nominal: z.number().min(0, 'Nominal wajib diisi'),
  description: z.string().optional(),
  proof: z.string().min(1, 'Bukti bayar wajib diunggah')
})

type BillFormSchema = z.infer<typeof BillFormSchema>

interface BillFormState {
  payment_type: 'cash' | 'transfer'
  nominal: number
  proof: string
  description: string
}

const form = reactive<BillFormState>({
  payment_type: 'cash',
  nominal: 0,
  proof: '',
  description: ''
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
  { accessorKey: 'payment_type', header: 'Metode' },
  { accessorKey: 'action', header: 'Aksi' }
]

// --- API ACTIONS ---
const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await useApi(`/finance/bill/${userId}`, {
      params: {
        page: pagination.value.current_page,
        limit: pagination.value.per_page
      },
      method: 'GET'
    })
    if (res.status === 1) {
      detailData.value = res.data
      if (res.pagination) { pagination.value = { ...res.pagination } }
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

    const checkoutRes = await useApi('/finance/payment/checkout', {
      method: 'POST',
      body: {
        person_id: userId,
        bills: targetBills.value.map((b) => b.id)
      }
    })
    if (!checkoutRes.data?.id) throw new Error('Gagal melakukan checkout')

    const paymentId = checkoutRes.data.id

    let finalImageUrl = form.proof
    if (proofFile.value) {
      const uploadRes = await fileUpload(proofFile.value)
      if (uploadRes) finalImageUrl = uploadRes
      else throw new Error('Gagal mengunggah gambar ke server')
    }

    const payload = {
      amount: totalSelectedAmount.value,
      proof: finalImageUrl,
      description: form.description || '',
      type: form.payment_type
    }

    const cashRes = await useApi(`/finance/payment/cash/${paymentId}`, {
      method: 'POST',
      body: payload
    })

    if (cashRes.status === 1) {
      toast.add({ title: 'Berhasil menyimpan pembayaran', color: 'success' })
      isOpen.value = false
      fetchDetail()
      resetForm()
    }
  } catch (err: any) {
    toast.add({ title: err?.message || 'Error server', color: 'error' })
  } finally {
    loading.value = false
  }
}

// --- UTILS & COMPUTED ---
const resetForm = () => {
  form.payment_type = 'cash'
  form.nominal = 0
  form.description = ''
  clearImage()
}

const clearImage = () => {
  if (form.proof?.startsWith('blob:')) {
    URL.revokeObjectURL(form.proof)
  }
  form.proof = ''
  proofFile.value = null
}

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
const selectPaymentType = (type: 'cash' | 'transfer') => {
  form.payment_type = type
  form.nominal = totalSelectedAmount.value
}

const handlePay = (row: any) => {
  targetBills.value = [row]
  form.payment_type = 'cash'
  form.nominal = Number(row.amount)
  isOpen.value = true
}

const handlePaySelected = () => {
  const unpaidSelection = selectedRowsData.value.filter(
    (r) => r.status === 'unpaid'
  )
  if (unpaidSelection.length === 0) return

  targetBills.value = unpaidSelection
  form.nominal = totalSelectedAmount.value
  isOpen.value = true
}

watch(proofFile, (newFiles) => {
  if (newFiles) {
    if (form.proof?.startsWith('blob:')) {
      URL.revokeObjectURL(form.proof)
    }
    form.proof = URL.createObjectURL(newFiles)
  }
})

watch(() => pagination.value.per_page, () => {
  pagination.value.current_page = 1
  fetchDetail()
})

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
                >{{ mapCategoryLabel(bill.category) }} ({{ formatDate(bill.bill_date) }})</span
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

          <!-- Pilihan Metode Pembayaran -->
          <UFormField label="Metode Pembayaran" required>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                :class="[
                  'flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer',
                  form.payment_type === 'cash'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                ]"
                @click="selectPaymentType('cash')"
              >
                <UIcon name="i-lucide-banknote" class="w-5 h-5 text-emerald-600" />
                <span>💵 Kas Tunai (Fisik)</span>
              </button>
              <button
                type="button"
                :class="[
                  'flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer',
                  form.payment_type === 'transfer'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600/20'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                ]"
                @click="selectPaymentType('transfer')"
              >
                <UIcon name="i-lucide-landmark" class="w-5 h-5 text-blue-600" />
                <span>🏦 Transfer Mandiri</span>
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1.5">
              <span v-if="form.payment_type === 'cash'">Uang fisik diterima langsung oleh pengurus / kasir (Masuk Kas Fisik - Akun 1000).</span>
              <span v-else>Warga mentransfer langsung ke Rekening Mandiri RW (Masuk Bank Mandiri - Akun 1100).</span>
            </p>
          </UFormField>

          <div v-if="form.payment_type === 'cash'" class="grid grid-cols-2 gap-4">
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

          <UFormField name="description" label="Keterangan (Opsional)">
            <UTextarea
              v-model="form.description"
              placeholder="Tambahkan catatan jika perlu..."
            />
          </UFormField>

          <UFormField name="proof" label="Bukti Bayar" required>
            <div class="w-full">
              <div
                v-if="form.proof"
                class="group relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
              >
                <img
                  :src="form.proof"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <UButton
                    color="error"
                    variant="solid"
                    icon="i-lucide-trash-2"
                    label="Hapus & Ganti"
                    @click="clearImage"
                  />
                </div>
              </div>
              <UFileUpload
                v-else
                v-model="proofFile"
                accept="image/*"
                :dropzone="true"
                class="aspect-video"
                icon="uil:image-upload"
                :ui="{ base: 'bg-neutral-100' }"
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
      class="bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-sm"
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
              mapCategoryLabel(row.original.category)
            }}</span>
            <span v-if="row.original.description" class="text-xs text-gray-500">
              {{ row.original.description }}
            </span>
            <span v-else class="text-[10px] text-gray-400">
              ID: {{ row.original.id.slice(0, 8) }}
            </span>
          </div>
        </template>

        <template #bill_date-cell="{ row }">
          <div class="flex flex-col">
            <span>{{ formatDate(row.original.bill_date) }}</span>
          </div>
        </template>

        <template #amount-cell="{ row }">
          <div class="flex flex-col">
            <span class="font-semibold">{{
              formatCurrency(row.original.amount)
            }}</span>
            <span
              v-if="row.original.discount > 0"
              class="text-[11px] text-emerald-600 font-medium"
            >
              Diskon: -{{ formatCurrency(row.original.discount) }}
            </span>
            <span
              v-if="row.original.penalty > 0"
              class="text-[11px] text-red-500 font-medium"
            >
              Denda: +{{ formatCurrency(row.original.penalty) }}
            </span>
          </div>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.status === 'unpaid' ? 'error' : 'success'"
            variant="subtle"
            class="font-bold uppercase"
          >
            {{ row.original.status === 'unpaid' ? 'Belum Lunas' : 'Lunas' }}
          </UBadge>
        </template>

        <template #payment_date-cell="{ row }">
          <span v-if="row.original.payment_date" class="text-gray-600">
            {{ formatDate(row.original.payment_date) }}
          </span>
          <span v-else class="text-gray-300 italic">-</span>
        </template>

        <template #payment_type-cell="{ row }">
          <UBadge
            v-if="row.original.payment_type"
            :color="row.original.payment_type === 'cash' ? 'success' : 'primary'"
            variant="soft"
            class="capitalize font-semibold"
          >
            <UIcon
              :name="
                row.original.payment_type === 'cash'
                  ? 'i-lucide-banknote'
                  : 'i-lucide-landmark'
              "
              class="mr-1 w-3.5 h-3.5"
            />
            {{ row.original.payment_type === 'cash' ? 'Kas Tunai' : 'Bank Mandiri' }}
          </UBadge>
          <span v-else class="text-gray-300 italic">-</span>
        </template>

        <template #action-cell="{ row }">
          <UButton
            v-if="row.original.status === 'unpaid'"
            label="Bayar"
            color="success"
            icon="i-lucide-receipt"
            @click="handlePay(row.original)"
          />
          <UButton
            v-else
            label="Kwitansi"
            color="primary"
            variant="subtle"
            size="sm"
            icon="i-lucide-receipt-text"
            @click="openReceipt(row.original)"
          />
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
        v-model:page="pagination.current_page"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        @update:page="fetchDetail"
      />
    </div>

    <!-- Modal Kwitansi -->
    <ReceiptModal
      v-model="isReceiptOpen"
      :bill="selectedReceiptBill"
      :resident-name="(userName as string) || selectedReceiptBill?.person?.name"
      :resident-kavling="selectedReceiptBill ? [selectedReceiptBill.residence_type || selectedReceiptBill.residence?.type, selectedReceiptBill.residence_kavling || selectedReceiptBill.residence?.kavling].filter(Boolean).join(' / ') : ''"
      :resident-address="selectedReceiptBill ? [selectedReceiptBill.residence_type || selectedReceiptBill.residence?.type, selectedReceiptBill.residence_kavling || selectedReceiptBill.residence?.kavling].filter(Boolean).join(' / ') : ''"
    />
  </div>
</template>

<style scoped>
:deep(table) {
  min-width: 100%;
}
:deep(th:last-child),
:deep(td:last-child) {
  position: sticky;
  right: 0;
  z-index: 1;
  background: white;
  box-shadow: -4px 0 8px -4px rgba(0, 0, 0, 0.08);
}
:deep(th:last-child) {
  background: #f9fafb;
}
</style>
