<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { fileUpload } from '~/services/files'
import { perPageLimit } from '~/const/utils'

definePageMeta({ middleware: ['auth'] })

const toast = useToast()

// --- STATE ---
const dataTransfers = ref<any[]>([])
const loading = ref(false)
const isOpenForm = ref(false)
const isOpenDetail = ref(false)
const selectedDetail = ref<any>(null)
const imageFile = ref<any>(null)

// Summary Balances
const balances = ref({
  cash_balance: 0,
  bank_balance: 0,
  total_balance: 0
})

// Filter States
const searchQuery = ref('')
const now = new Date()
const selectedMonth = ref(now.getMonth() + 1)
const selectedYear = ref(now.getFullYear())

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

const transferType = ref<'deposit' | 'withdraw' | 'custom'>('deposit')

const accountOptions = [
  { key: 1000, label: '💵 Kas Fisik (Brankas RW)' },
  { key: 1100, label: '🏦 Bank Mandiri (Rekening RW)' },
  { key: 1101, label: '📦 Kas Titip Warga' },
  { key: 1102, label: '🏛️ Kas RW' }
]

const monthOptions = [
  { label: 'Januari', value: 1 },
  { label: 'Februari', value: 2 },
  { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },
  { label: 'Agustus', value: 8 },
  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },
  { label: 'November', value: 11 },
  { label: 'Desember', value: 12 }
]

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear; i >= 2023; i--) {
    years.push({ label: i.toString(), value: i })
  }
  return years
})

// --- VALIDATION SCHEMA ---
const TransferFormSchema = z.object({
  from_tag: z.number().min(1, 'Akun asal wajib dipilih'),
  to_tag: z.number().min(1, 'Akun tujuan wajib dipilih'),
  amount: z.string().min(1, 'Nominal wajib diisi'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  description: z.string().optional(),
  proof: z.string().optional()
}).refine(data => data.from_tag !== data.to_tag, {
  message: 'Akun asal dan akun tujuan tidak boleh sama',
  path: ['to_tag']
}).refine(data => {
  const num = Number(data.amount)
  if (isNaN(num) || num <= 0) return true
  let maxBal: number | null = null
  if (data.from_tag === 1000) maxBal = balances.value.cash_balance
  else if (data.from_tag === 1100) maxBal = balances.value.bank_balance
  if (maxBal !== null && num > maxBal) {
    return false
  }
  return true
}, {
  message: 'Nominal mutasi tidak boleh melebihi saldo akun asal yang tersedia',
  path: ['amount']
})

type TransferFormSchema = z.infer<typeof TransferFormSchema>

const form = reactive({
  from_tag: 1000 as number | undefined,
  to_tag: 1100 as number | undefined,
  amount: '',
  date: new Date().toISOString().split('T')[0],
  description: '',
  proof: ''
})

const sourceBalance = computed(() => {
  if (form.from_tag === 1000) return balances.value.cash_balance
  if (form.from_tag === 1100) return balances.value.bank_balance
  return null
})

const isAmountExceeded = computed(() => {
  if (sourceBalance.value === null) return false
  const num = Number(form.amount)
  if (isNaN(num) || num <= 0) return false
  return num > sourceBalance.value
})

const setMaxAmount = () => {
  if (sourceBalance.value !== null && sourceBalance.value > 0) {
    form.amount = String(Math.floor(sourceBalance.value))
  }
}

// --- TABLE COLUMNS ---
const columns = [
  { accessorKey: 'date', header: 'Tanggal' },
  { accessorKey: 'route', header: 'Alur Perpindahan' },
  { accessorKey: 'amount', header: 'Nominal' },
  { accessorKey: 'description', header: 'Keterangan' },
  { accessorKey: 'operator', header: 'Petugas' },
  { accessorKey: 'action', header: 'Aksi' }
]

// --- ACTIONS ---
const getBalances = async () => {
  try {
    const res = await useApi('/finance/cash-transfer/balances')
    if (res.status === 1) {
      balances.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch balances:', err)
  }
}

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi('/finance/cash-transfer', {
      params: {
        page: pagination.value.current_page,
        limit: pagination.value.per_page,
        search: searchQuery.value,
        month: selectedMonth.value,
        year: selectedYear.value
      }
    })

    if (res.status === 1) {
      dataTransfers.value = res.data
      if (res.pagination) {
        pagination.value = { ...res.pagination }
      }
    }
  } catch (err) {
    console.error('Failed to fetch transfers:', err)
  } finally {
    loading.value = false
  }
}

const getDetail = async (id: string) => {
  try {
    const res = await useApi(`/finance/cash-transfer/${id}`)
    if (res.status === 1) {
      selectedDetail.value = res.data
      isOpenDetail.value = true
    }
  } catch (err) {
    console.error('Detail fetch error:', err)
  }
}

const setPresetMode = (mode: 'deposit' | 'withdraw' | 'custom') => {
  transferType.value = mode
  if (mode === 'deposit') {
    form.from_tag = 1000 // Kas Fisik
    form.to_tag = 1100 // Bank Mandiri
    form.description = 'Setor tunai kas RW ke Bank Mandiri'
  } else if (mode === 'withdraw') {
    form.from_tag = 1100 // Bank Mandiri
    form.to_tag = 1000 // Kas Fisik
    form.description = 'Tarik tunai Bank Mandiri untuk kas kecil brankas'
  }
}

const openAddModal = (preset: 'deposit' | 'withdraw' | 'custom' = 'deposit') => {
  resetFormFields()
  setPresetMode(preset)
  isOpenForm.value = true
}

const resetFormFields = () => {
  form.from_tag = 1000
  form.to_tag = 1100
  form.amount = ''
  form.date = new Date().toISOString().split('T')[0]
  form.description = 'Setor tunai kas RW ke Bank Mandiri'
  clearImage()
}

const clearImage = () => {
  if (form.proof?.startsWith('blob:')) URL.revokeObjectURL(form.proof)
  form.proof = ''
  imageFile.value = null
}

const saveData = async (event: FormSubmitEvent<TransferFormSchema>) => {
  loading.value = true
  try {
    let finalImageUrl = form.proof

    if (imageFile.value) {
      const uploadRes = await fileUpload(imageFile.value)
      if (uploadRes) finalImageUrl = uploadRes
    }

    const payload = {
      from_tag: event.data.from_tag,
      to_tag: event.data.to_tag,
      amount: event.data.amount,
      date: event.data.date,
      description: event.data.description,
      proof: finalImageUrl
    }

    const res = await useApi('/finance/cash-transfer', {
      method: 'POST',
      body: payload
    })

    if (res.status === 1) {
      toast.add({
        title: 'Mutasi kas berhasil dicatat!',
        color: 'success'
      })
      isOpenForm.value = false
      getBalances()
      getData()
    }
  } catch (err: any) {
    toast.add({
      title: err?.data?.message || err?.message || 'Gagal menyimpan mutasi',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Watchers
watch(imageFile, (newFile) => {
  if (newFile) {
    if (form.proof?.startsWith('blob:')) URL.revokeObjectURL(form.proof)
    form.proof = URL.createObjectURL(newFile)
  }
})

watch([selectedMonth, selectedYear], () => {
  pagination.value.current_page = 1
  getData()
})

watch(
  () => pagination.value.per_page,
  () => {
    pagination.value.current_page = 1
    getData()
  }
)

onMounted(() => {
  getBalances()
  getData()
})
</script>

<template>
  <div class="space-y-6">
    <ConfirmDialog />

    <SharedHeaderBg>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary-50 rounded-lg">
          <UIcon
            name="i-lucide-arrow-left-right"
            class="w-5 h-5 text-primary-600"
          />
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-900">Mutasi Kas & Bank</h2>
          <p class="text-xs text-gray-500">Pencatatan perpindahan dana internal (Setor Tunai & Tarik Tunai)</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          color="success"
          variant="solid"
          icon="i-lucide-arrow-up-right"
          @click="openAddModal('deposit')"
        >
          Setor ke Bank Mandiri
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-down-left"
          @click="openAddModal('withdraw')"
        >
          Tarik Tunai ke Kas
        </UButton>
      </div>
    </SharedHeaderBg>

    <!-- SUMMARY BALANCES -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        class="relative overflow-hidden p-6 rounded-[2rem] bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md hover:shadow-lg transition-all"
      >
        <div class="flex items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2">
            <div class="p-2 rounded-xl bg-white/15 backdrop-blur-sm">
              <UIcon name="i-lucide-banknote" class="w-5 h-5" />
            </div>
            <p class="text-xs font-bold uppercase tracking-wider text-white/90">
              Kas Fisik (Brankas)
            </p>
          </div>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20">
            Tag #1000
          </span>
        </div>
        <p class="text-2xl font-black tabular-nums">
          {{ formatCurrency(balances.cash_balance) }}
        </p>
        <p class="text-[11px] text-white/70 mt-1">
          Uang tunai siap pakai di bendahara
        </p>
      </div>

      <div
        class="relative overflow-hidden p-6 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-md hover:shadow-lg transition-all"
      >
        <div class="flex items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2">
            <div class="p-2 rounded-xl bg-white/15 backdrop-blur-sm">
              <UIcon name="i-lucide-landmark" class="w-5 h-5" />
            </div>
            <p class="text-xs font-bold uppercase tracking-wider text-white/90">
              Bank Mandiri
            </p>
          </div>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20">
            Tag #1100
          </span>
        </div>
        <p class="text-2xl font-black tabular-nums">
          {{ formatCurrency(balances.bank_balance) }}
        </p>
        <p class="text-[11px] text-white/70 mt-1">
          Saldo rekening resmi RW di Mandiri
        </p>
      </div>

      <div
        class="relative overflow-hidden p-6 rounded-[2rem] bg-gradient-to-br from-neutral-900 to-neutral-950 text-white shadow-md hover:shadow-lg transition-all"
      >
        <div class="flex items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2">
            <div class="p-2 rounded-xl bg-white/15 backdrop-blur-sm">
              <UIcon name="i-lucide-wallet" class="w-5 h-5 text-secondary-400" />
            </div>
            <p class="text-xs font-bold uppercase tracking-wider text-white/90">
              Total Kas Likuid
            </p>
          </div>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary-500/30 text-secondary-300">
            Kas + Bank
          </span>
        </div>
        <p class="text-2xl font-black text-secondary-400 tabular-nums">
          {{ formatCurrency(balances.total_balance) }}
        </p>
        <p class="text-[11px] text-white/60 mt-1">
          Total kekayaan likuid RW XI BWR
        </p>
      </div>
    </div>

    <!-- FILTER BAR -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
      <div class="flex items-center gap-3">
        <USelect
          v-model="selectedMonth"
          :items="monthOptions"
          label-key="label"
          value-key="value"
          class="w-36"
        />
        <USelect
          v-model="selectedYear"
          :items="yearOptions"
          label-key="label"
          value-key="value"
          class="w-28"
        />
      </div>

      <div class="w-72">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Cari keterangan mutasi..."
          @keyup.enter="getData"
        />
      </div>
    </div>

    <!-- TABLE -->
    <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <UTable :data="dataTransfers" :columns="columns" :loading="loading">
        <template #date-cell="{ row }">
          <div class="text-sm font-semibold text-gray-900">
            {{ formatDate(row.original.date) }}
          </div>
          <div class="text-[10px] text-gray-400">
            {{ formatDateTime(row.original.created_at) }}
          </div>
        </template>

        <template #route-cell="{ row }">
          <div class="flex items-center gap-2">
            <UBadge
              :color="row.original.from_tag == 1100 ? 'info' : 'success'"
              variant="subtle"
              size="sm"
            >
              {{ row.original.from_coa?.name || `Tag #${row.original.from_tag}` }}
            </UBadge>
            <UIcon name="i-lucide-arrow-right" class="w-4 h-4 text-gray-400" />
            <UBadge
              :color="row.original.to_tag == 1100 ? 'info' : 'success'"
              variant="subtle"
              size="sm"
            >
              {{ row.original.to_coa?.name || `Tag #${row.original.to_tag}` }}
            </UBadge>
          </div>
        </template>

        <template #amount-cell="{ row }">
          <span class="font-black text-gray-900 text-sm tabular-nums">
            {{ formatCurrency(row.original.amount) }}
          </span>
        </template>

        <template #description-cell="{ row }">
          <span class="text-sm text-gray-600">
            {{ row.original.description || '-' }}
          </span>
        </template>

        <template #operator-cell="{ row }">
          <span class="text-xs text-gray-500">
            {{ row.original.operator?.name || 'Sistem' }}
          </span>
        </template>

        <template #action-cell="{ row }">
          <UButton
            icon="i-heroicons-eye"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="getDetail(row.original.id)"
          />
        </template>
      </UTable>
    </div>

    <!-- PAGINATION -->
    <div class="flex justify-between items-center px-4">
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <span>Tampilkan</span>
        <USelect
          v-model.number="pagination.per_page"
          :items="perPageLimit"
          class="w-20"
        />
      </div>
      <UPagination
        v-model:page="pagination.current_page"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        @update:page="getData"
      />
    </div>

    <!-- FORM MODAL -->
    <UModal v-model:open="isOpenForm" :ui="{ content: 'sm:max-w-lg' }">
      <template #header>
        <div class="flex items-center gap-2 font-bold text-gray-900">
          <UIcon name="i-lucide-arrow-left-right" class="w-5 h-5 text-primary-600" />
          <span>Form Mutasi Kas & Bank Internal</span>
        </div>
      </template>

      <template #body>
        <div class="mb-5 flex gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
            :class="transferType === 'deposit' ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-900'"
            @click="setPresetMode('deposit')"
          >
            📥 Setor ke Bank
          </button>
          <button
            type="button"
            class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
            :class="transferType === 'withdraw' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-900'"
            @click="setPresetMode('withdraw')"
          >
            📤 Tarik ke Kas Fisik
          </button>
          <button
            type="button"
            class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
            :class="transferType === 'custom' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'"
            @click="setPresetMode('custom')"
          >
            ⚙️ Kustom
          </button>
        </div>

        <UForm
          :schema="TransferFormSchema"
          :state="form"
          class="space-y-4"
          @submit="saveData"
        >
          <div class="grid grid-cols-2 gap-3">
            <UFormField name="from_tag" label="Dari Akun (Sumber)" required>
              <template #hint>
                <span
                  v-if="sourceBalance !== null"
                  class="text-[11px] font-bold"
                  :class="sourceBalance > 0 ? 'text-emerald-600' : 'text-rose-600'"
                >
                  Saldo: {{ formatCurrency(sourceBalance) }}
                </span>
              </template>
              <USelectMenu
                v-model="form.from_tag"
                :items="accountOptions"
                label-key="label"
                value-key="key"
                size="lg"
                :disabled="transferType !== 'custom'"
              />
            </UFormField>

            <UFormField name="to_tag" label="Ke Akun (Tujuan)" required>
              <USelectMenu
                v-model="form.to_tag"
                :items="accountOptions"
                label-key="label"
                value-key="key"
                size="lg"
                :disabled="transferType !== 'custom'"
              />
            </UFormField>
          </div>

          <!-- Alert jika saldo sumber kosong -->
          <div
            v-if="sourceBalance !== null && sourceBalance <= 0"
            class="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800"
          >
            <UIcon name="i-lucide-alert-circle" class="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Saldo pada akun sumber saat ini <strong>Rp 0</strong>. Tidak dapat melakukan mutasi keluar dari akun ini.
            </span>
          </div>

          <!-- Alert jika nominal melebihi saldo -->
          <div
            v-else-if="isAmountExceeded"
            class="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-800"
          >
            <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Nominal yang dimasukkan melebihi saldo sumber yang tersedia (Maks. <strong>{{ formatCurrency(sourceBalance || 0) }}</strong>).
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <UFormField name="amount" label="Nominal (Rp)" required>
              <template #hint>
                <button
                  v-if="sourceBalance !== null && sourceBalance > 0"
                  type="button"
                  class="text-[11px] font-bold text-primary-600 hover:text-primary-700 underline cursor-pointer"
                  @click="setMaxAmount"
                >
                  Set Maksimal
                </button>
              </template>
              <UInput
                v-model="form.amount"
                placeholder="Contoh: 5000000"
                size="lg"
                :color="isAmountExceeded ? 'error' : undefined"
              >
                <template #leading>
                  <span class="text-gray-400 text-xs font-bold">Rp</span>
                </template>
              </UInput>
            </UFormField>

            <UFormField name="date" label="Tanggal Mutasi" required>
              <UInput
                v-model="form.date"
                type="date"
                size="lg"
              />
            </UFormField>
          </div>

          <UFormField name="description" label="Keterangan / Catatan">
            <UTextarea
              v-model="form.description"
              placeholder="Contoh: Setor uang tagihan IPL & Air Artetis ke rekening Mandiri..."
              :rows="2"
            />
          </UFormField>

          <UFormField name="proof" label="Bukti Setor / Slip Transfer (Opsional)">
            <div class="w-full">
              <div
                v-if="form.proof"
                class="relative group aspect-video rounded-xl border-2 border-gray-100 overflow-hidden bg-gray-50"
              >
                <img :src="form.proof" class="w-full h-full object-contain" />
                <div
                  class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                v-model="imageFile"
                accept="image/*"
                :dropzone="true"
                class="aspect-video"
                icon="i-heroicons-camera"
              />
            </div>
          </UFormField>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <UButton variant="ghost" color="neutral" @click="isOpenForm = false">
              Batal
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="loading"
              :disabled="isAmountExceeded || (sourceBalance !== null && sourceBalance <= 0)"
              class="px-8"
            >
              Simpan Mutasi
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- DETAIL MODAL -->
    <UModal v-model:open="isOpenDetail" :ui="{ content: 'sm:max-w-2xl' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="font-bold text-gray-900">Rincian Mutasi Kas</h3>
          <UBadge color="success" variant="subtle">Tercatat di Jurnal</UBadge>
        </div>
      </template>
      <template #body>
        <div v-if="selectedDetail" class="space-y-5">
          <div class="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-gray-400 font-bold uppercase">Tanggal Mutasi</p>
                <p class="text-base font-bold text-gray-900">{{ formatDate(selectedDetail.date) }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-400 font-bold uppercase">Nominal</p>
                <p class="text-xl font-black text-gray-900">{{ formatCurrency(selectedDetail.amount) }}</p>
              </div>
            </div>

            <div class="pt-3 border-t border-gray-200/60 flex items-center justify-between">
              <div>
                <p class="text-[11px] text-gray-400 font-bold uppercase">Dari Akun</p>
                <UBadge color="emerald" variant="subtle" size="sm" class="mt-1">
                  {{ selectedDetail.from_coa?.name || `Tag #${selectedDetail.from_tag}` }}
                </UBadge>
              </div>
              <UIcon name="i-lucide-arrow-right" class="w-5 h-5 text-gray-400" />
              <div class="text-right">
                <p class="text-[11px] text-gray-400 font-bold uppercase">Ke Akun</p>
                <UBadge color="info" variant="subtle" size="sm" class="mt-1">
                  {{ selectedDetail.to_coa?.name || `Tag #${selectedDetail.to_tag}` }}
                </UBadge>
              </div>
            </div>
          </div>

          <div>
            <p class="text-xs font-bold text-gray-400 uppercase mb-1">Keterangan</p>
            <p class="text-sm text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
              "{{ selectedDetail.description || 'Tidak ada catatan tambahan' }}"
            </p>
          </div>

          <div v-if="selectedDetail.proof">
            <p class="text-xs font-bold text-gray-400 uppercase mb-2">Bukti Transfer / Slip Bank</p>
            <div class="rounded-xl overflow-hidden border border-gray-200 bg-black/5 aspect-video max-h-72 flex items-center justify-center">
              <img :src="selectedDetail.proof" class="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
