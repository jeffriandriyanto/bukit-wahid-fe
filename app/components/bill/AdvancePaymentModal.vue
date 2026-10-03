<script setup lang="ts">
import { fileUpload } from '~/services/files'
import { formatCurrency } from '~/utils'

interface Props {
  modelValue: boolean
  defaultPersonId?: string
  defaultPersonName?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'success'])

const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

// --- STATE ---
const loadingResidents = ref(false)
const loadingOptions = ref(false)
const loadingPreview = ref(false)
const submitting = ref(false)

const residentList = ref<{ key: string; label: string }[]>([])
const selectedPersonId = ref<string | undefined>(props.defaultPersonId || undefined)
const selectedCategory = ref<'ipl' | 'dues'>('ipl')
const selectedResidenceId = ref<string | undefined>(undefined)
const targetMonth = ref<string>('')

// Options from backend
const advanceOptions = ref<{
  person?: { id: string; name: string; phone: string }
  residences?: any[]
  family?: any
  current_month?: string
  ipl_cost?: number
  dues_amount?: number
}>({})

// Preview from backend
const previewData = ref<{
  category?: string
  start_month?: string
  target_month?: string
  total_months?: number
  total_amount?: number
  items?: any[]
} | null>(null)
const previewError = ref<string | null>(null)

// Payment Form
const paymentType = ref<'cash' | 'transfer'>('cash')
const nominal = ref<number>(0)
const description = ref<string>('')
const proof = ref<string>('')
const proofFile = ref<any>(null)

// --- HELPER FUNCTIONS ---
function clearImage() {
  if (import.meta.client && typeof window !== 'undefined' && proof.value?.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(proof.value)
    } catch {}
  }
  proof.value = ''
  proofFile.value = null
}

function resetState() {
  previewData.value = null
  previewError.value = null
  paymentType.value = 'cash'
  nominal.value = 0
  description.value = ''
  clearImage()
}

function updateDefaultTargetMonth() {
  if (selectedCategory.value === 'ipl') {
    const currentRes = (advanceOptions.value.residences || []).find(
      r => r.id === selectedResidenceId.value
    )
    if (currentRes?.next_ipl_month) {
      targetMonth.value = currentRes.next_ipl_month
    } else if (advanceOptions.value.current_month) {
      targetMonth.value = advanceOptions.value.current_month
    }
  } else {
    if (advanceOptions.value.family?.next_dues_month) {
      targetMonth.value = advanceOptions.value.family.next_dues_month
    } else if (advanceOptions.value.current_month) {
      targetMonth.value = advanceOptions.value.current_month
    }
  }
}

// --- FETCH DROPDOWN RESIDENTS ---
async function fetchResidents() {
  if (residentList.value.length > 0) return
  loadingResidents.value = true
  try {
    const res = await useApi<any>('/dropdown/resident', { method: 'GET' })
    if (res?.status === 1 && Array.isArray(res.data)) {
      residentList.value = res.data
    }
  } catch (err) {
    console.error('Fetch residents error:', err)
  } finally {
    loadingResidents.value = false
  }
}

// --- FETCH ADVANCE OPTIONS FOR PERSON ---
async function fetchOptions() {
  if (!selectedPersonId.value) {
    advanceOptions.value = {}
    previewData.value = null
    return
  }

  loadingOptions.value = true
  previewError.value = null
  try {
    const res = await useApi<any>('/finance/bill/advance-options', {
      params: { person_id: selectedPersonId.value },
      method: 'GET'
    })

    if (res?.status === 1) {
      advanceOptions.value = res.data || {}
      
      // Auto-select residence if available
      const residences = advanceOptions.value.residences || []
      if (residences.length > 0) {
        if (!selectedResidenceId.value || !residences.some(r => r.id === selectedResidenceId.value)) {
          selectedResidenceId.value = residences[0].id
        }
      } else {
        selectedResidenceId.value = undefined
      }

      // Default target month
      updateDefaultTargetMonth()
    }
  } catch (err: any) {
    console.error('Fetch advance options error:', err)
    previewError.value = err?.message || 'Gagal memuat opsi warga'
  } finally {
    loadingOptions.value = false
  }
}

// --- FETCH PREVIEW ---
async function fetchPreview() {
  if (!selectedPersonId.value || !targetMonth.value) {
    previewData.value = null
    return
  }

  if (selectedCategory.value === 'ipl' && !selectedResidenceId.value) {
    previewData.value = null
    return
  }

  loadingPreview.value = true
  previewError.value = null
  try {
    const params: any = {
      person_id: selectedPersonId.value,
      category: selectedCategory.value,
      target_month: targetMonth.value
    }
    if (selectedCategory.value === 'ipl') {
      params.residence_id = selectedResidenceId.value
    }

    const res = await useApi<any>('/finance/bill/advance-preview', {
      params,
      method: 'GET'
    })

    if (res?.status === 1) {
      previewData.value = res.data
      nominal.value = res.data.total_amount || 0
    } else {
      previewData.value = null
      previewError.value = res?.message || 'Gagal memuat kalkulasi tagihan'
    }
  } catch (err: any) {
    previewData.value = null
    previewError.value = err?.data?.message || err?.message || 'Gagal memuat kalkulasi tagihan'
  } finally {
    loadingPreview.value = false
  }
}

// --- COMPUTED ---
const totalAmount = computed(() => previewData.value?.total_amount || 0)

const returnAmount = computed(() => {
  if (paymentType.value !== 'cash') return 0
  const diff = nominal.value - totalAmount.value
  return diff > 0 ? diff : 0
})

// --- WATCHERS ---
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      fetchResidents()
      if (props.defaultPersonId) {
        selectedPersonId.value = props.defaultPersonId
      }
      fetchOptions()
    } else {
      resetState()
    }
  }
)

watch(selectedPersonId, () => {
  fetchOptions()
})

watch(selectedCategory, () => {
  updateDefaultTargetMonth()
  fetchPreview()
})

watch(selectedResidenceId, () => {
  if (selectedCategory.value === 'ipl') {
    updateDefaultTargetMonth()
    fetchPreview()
  }
})

let debounceTimer: any = null
watch(targetMonth, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchPreview()
  }, 300)
})

watch(proofFile, (newFiles) => {
  if (newFiles && import.meta.client && typeof window !== 'undefined') {
    if (proof.value?.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(proof.value)
      } catch {}
    }
    try {
      proof.value = URL.createObjectURL(newFiles)
    } catch {}
  }
})

// --- SUBMIT ---
async function handleSubmit() {
  if (!selectedPersonId.value) {
    toast.add({ title: 'Pilih warga terlebih dahulu', color: 'error' })
    return
  }
  if (selectedCategory.value === 'ipl' && !selectedResidenceId.value) {
    toast.add({ title: 'Pilih unit rumah / kavling untuk pembayaran IPL', color: 'error' })
    return
  }
  if (!targetMonth.value) {
    toast.add({ title: 'Pilih bulan target pembayaran', color: 'error' })
    return
  }
  if (!previewData.value || !previewData.value.items?.length) {
    toast.add({ title: 'Tidak ada tagihan yang valid untuk diproses', color: 'error' })
    return
  }
  if (paymentType.value === 'cash' && nominal.value < totalAmount.value) {
    toast.add({ title: 'Uang yang diterima kurang dari total tagihan', color: 'error' })
    return
  }

  submitting.value = true
  try {
    let finalImageUrl = proof.value || null
    if (proofFile.value) {
      const uploadRes = await fileUpload(proofFile.value)
      if (uploadRes) {
        finalImageUrl = uploadRes
      } else {
        throw new Error('Gagal mengunggah bukti bayar ke server')
      }
    }

    const payload = {
      person_id: selectedPersonId.value,
      category: selectedCategory.value,
      residence_id: selectedCategory.value === 'ipl' ? selectedResidenceId.value : null,
      target_month: targetMonth.value,
      payment_type: paymentType.value,
      nominal: nominal.value,
      proof: finalImageUrl,
      description: description.value || ''
    }

    const res = await useApi<any>('/finance/bill/advance-checkout', {
      method: 'POST',
      body: payload
    })

    if (res?.status === 1) {
      toast.add({
        title: 'Pembayaran Berhasil!',
        description: res.message || 'Tagihan di muka berhasil digenerate dan dilunasi.',
        color: 'success'
      })
      isOpen.value = false
      emit('success')
    } else {
      toast.add({
        title: 'Gagal Memproses Pembayaran',
        description: res?.message || 'Terjadi kesalahan sistem',
        color: 'error'
      })
    }
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.data?.message || err?.message || 'Gagal memproses pembayaran',
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :ui="{
      content: 'sm:max-w-3xl'
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-2xl bg-primary-100 text-primary-700">
          <UIcon name="i-lucide-calendar-plus" class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-900">
            Pembayaran Tagihan di Muka (Advance)
          </h3>
          <p class="text-xs text-gray-500">
            Generate dan lunaskan tagihan periode mendatang (IPL & Iuran RW) sekaligus
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- 1. Pilih Warga & Kategori -->
        <div class="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Pilih Warga -->
            <UFormField label="Warga / Pembayar" required>
              <USelectMenu
                v-model="selectedPersonId"
                :items="residentList"
                value-key="key"
                label-key="label"
                placeholder="Cari nama warga..."
                searchable
                class="w-full"
                :disabled="!!props.defaultPersonId"
              />
            </UFormField>

            <!-- Kategori Tagihan -->
            <UFormField label="Kategori Tagihan" required>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  :class="[
                    'flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-bold transition-all cursor-pointer',
                    selectedCategory === 'ipl'
                      ? 'border-primary-600 bg-primary-50 text-primary-800 ring-2 ring-primary-600/20 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
                  ]"
                  @click="selectedCategory = 'ipl'"
                >
                  <UIcon name="i-lucide-home" class="w-4 h-4 text-primary-600" />
                  <span>IPL</span>
                </button>
                <button
                  type="button"
                  :class="[
                    'flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-bold transition-all cursor-pointer',
                    selectedCategory === 'dues'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-600/20 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
                  ]"
                  @click="selectedCategory = 'dues'"
                >
                  <UIcon name="i-lucide-users" class="w-4 h-4 text-indigo-600" />
                  <span>Iuran RW</span>
                </button>
              </div>
            </UFormField>
          </div>

          <!-- Pilihan Unit Kavling (jika IPL) atau Info KK (jika Dues) -->
          <div v-if="selectedCategory === 'ipl'" class="space-y-2">
            <UFormField
              label="Unit Rumah / Kavling"
              help="Tarif IPL dihitung berdasarkan luas tanah unit kavling yang dipilih"
              required
            >
              <div v-if="loadingOptions" class="py-2 text-xs text-gray-400">
                Memuat data kavling...
              </div>
              <div v-else-if="!advanceOptions.residences?.length" class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-amber-600 shrink-0" />
                <span>Warga ini belum terdaftar memiliki unit rumah/kavling dengan PIC yang sesuai.</span>
              </div>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div
                  v-for="res in advanceOptions.residences"
                  :key="res.id"
                  :class="[
                    'p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left',
                    selectedResidenceId === res.id
                      ? 'border-primary-600 bg-primary-50/70 text-primary-900 ring-2 ring-primary-600/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  ]"
                  @click="selectedResidenceId = res.id"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-sm">{{ res.type }} - {{ res.kavling }}</span>
                    <UBadge size="xs" variant="subtle" color="primary">
                      {{ res.land_size }} m²
                    </UBadge>
                  </div>
                  <div class="mt-2 text-xs text-gray-500 flex items-center justify-between">
                    <span>Posisi Lunas:</span>
                    <span class="font-semibold text-gray-700">
                      {{ res.latest_ipl_month ? res.latest_ipl_month : 'Belum Ada' }}
                    </span>
                  </div>
                </div>
              </div>
            </UFormField>
          </div>

          <div v-else class="space-y-2">
            <UFormField label="Kartu Keluarga (KK)">
              <div v-if="loadingOptions" class="py-2 text-xs text-gray-400">
                Memuat data keluarga...
              </div>
              <div v-else-if="!advanceOptions.family" class="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <UIcon name="i-lucide-alert-circle" class="w-4 h-4 text-red-600 shrink-0" />
                <span>Warga belum terdaftar dalam Kartu Keluarga (KK). Iuran RW memerlukan entitas KK.</span>
              </div>
              <div v-else class="p-3.5 bg-white rounded-xl border border-indigo-100 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <UIcon name="i-lucide-id-card" class="w-5 h-5" />
                  </div>
                  <div>
                    <div class="text-sm font-bold text-gray-900">No KK: {{ advanceOptions.family.no_kk || '-' }}</div>
                    <div class="text-xs text-gray-500">Alamat: {{ advanceOptions.family.address || '-' }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs text-gray-400">Posisi Lunas s/d:</div>
                  <div class="text-xs font-bold text-indigo-700">
                    {{ advanceOptions.family.latest_dues_month || 'Belum Ada' }}
                  </div>
                </div>
              </div>
            </UFormField>
          </div>

          <!-- Periode Bayar Hingga -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200/60">
            <UFormField
              label="Bayar Hingga Bulan (Target)"
              help="Sistem akan menghitung berurutan dari bulan berikutnya yang belum lunas s/d bulan ini"
              required
            >
              <UInput
                v-model="targetMonth"
                type="month"
                class="w-full font-mono font-bold"
              />
            </UFormField>

            <div class="flex flex-col justify-end">
              <div v-if="previewData" class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-center justify-between">
                <div>
                  <div class="text-xs text-emerald-700 font-medium">Periode Pembayaran:</div>
                  <div class="text-xs font-bold font-mono">
                    {{ previewData.start_month }} s/d {{ previewData.target_month }}
                  </div>
                </div>
                <UBadge color="success" variant="solid" size="md">
                  {{ previewData.total_months }} Bulan
                </UBadge>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Tabel Preview Rincian Tagihan -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Rincian Tagihan yang Akan Dibuat & Dilunasi
            </span>
            <span v-if="loadingPreview" class="text-xs text-primary-600 flex items-center gap-1 font-medium">
              <UIcon name="i-lucide-loader-2" class="w-3.5 h-3.5 animate-spin" />
              Menghitung kalkulasi...
            </span>
          </div>

          <!-- Preview Error -->
          <div v-if="previewError" class="p-4 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <UIcon name="i-lucide-alert-circle" class="w-4 h-4 text-red-600 shrink-0" />
            <span>{{ previewError }}</span>
          </div>

          <!-- Preview Table -->
          <div
            v-else-if="previewData?.items?.length"
            class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs"
          >
            <div class="max-h-60 overflow-y-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-gray-50/80 text-gray-500 font-bold uppercase sticky top-0 border-b border-gray-100">
                  <tr>
                    <th class="py-2.5 px-3">Bulan</th>
                    <th class="py-2.5 px-3">Keterangan</th>
                    <th class="py-2.5 px-3 text-right">Tarif</th>
                    <th class="py-2.5 px-3 text-right">Diskon</th>
                    <th class="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr
                    v-for="(item, idx) in previewData.items"
                    :key="idx"
                    class="hover:bg-gray-50/50"
                  >
                    <td class="py-2.5 px-3 font-semibold text-gray-900 whitespace-nowrap">
                      {{ item.month_label }} ({{ item.month }})
                    </td>
                    <td class="py-2.5 px-3 text-gray-600">
                      {{ item.unit_desc }}
                      <span v-if="item.is_existing" class="text-[10px] text-amber-600 font-bold ml-1">(Tagihan Terdaftar)</span>
                    </td>
                    <td class="py-2.5 px-3 text-right font-mono text-gray-600">
                      {{ formatCurrency(item.gross_amount) }}
                    </td>
                    <td class="py-2.5 px-3 text-right text-emerald-600 font-medium">
                      {{ item.discount_amount > 0 ? formatCurrency(item.discount_amount) : '-' }}
                    </td>
                    <td class="py-2.5 px-3 text-right font-bold text-gray-900 font-mono">
                      {{ formatCurrency(item.amount) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Total Bar -->
            <div class="p-4 bg-primary-50 border-t border-primary-100 flex items-center justify-between">
              <div class="text-sm font-bold text-primary-900">
                Total Tagihan ({{ previewData.total_months }} Bulan)
              </div>
              <div class="text-xl font-black text-primary-700 font-mono">
                {{ formatCurrency(totalAmount) }}
              </div>
            </div>
          </div>

          <div v-else-if="!loadingPreview" class="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
            Pilih warga, kategori, unit kavling, dan target bulan untuk menampilkan kalkulasi tagihan.
          </div>
        </div>

        <!-- 3. Form Pembayaran (Kasir / Transfer) -->
        <div v-if="previewData?.items?.length" class="space-y-4 pt-2 border-t border-gray-100">
          <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Informasi Pembayaran
          </span>

          <!-- Pilihan Metode Pembayaran -->
          <UFormField label="Metode Pembayaran" required>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                :class="[
                  'flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer',
                  paymentType === 'cash'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                ]"
                @click="paymentType = 'cash'"
              >
                <UIcon name="i-lucide-banknote" class="w-5 h-5 text-emerald-600" />
                <span>💵 Kas Tunai (Fisik)</span>
              </button>
              <button
                type="button"
                :class="[
                  'flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer',
                  paymentType === 'transfer'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600/20'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                ]"
                @click="paymentType = 'transfer'"
              >
                <UIcon name="i-lucide-landmark" class="w-5 h-5 text-blue-600" />
                <span>🏦 Transfer Mandiri</span>
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1.5">
              <span v-if="paymentType === 'cash'">Uang fisik diterima kasir/pengurus ➡️ Masuk Akun Kas Fisik (1000).</span>
              <span v-else>Warga mentransfer ke Bank Mandiri RW ➡️ Masuk Akun Bank Mandiri (1100).</span>
            </p>
          </UFormField>

          <!-- Input Uang Diterima & Kembalian (Jika Tunai) -->
          <div v-if="paymentType === 'cash'" class="grid grid-cols-2 gap-4">
            <UFormField label="Uang Diterima" required>
              <UInput
                v-model.number="nominal"
                type="number"
                placeholder="Nominal uang diterima"
                icon="i-lucide-banknote"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Kembalian">
              <UInput
                :model-value="formatCurrency(returnAmount)"
                readonly
                class="bg-gray-100 font-bold font-mono text-gray-700 w-full"
              />
            </UFormField>
          </div>

          <!-- Keterangan -->
          <UFormField label="Keterangan (Opsional)">
            <UTextarea
              v-model="description"
              placeholder="Catatan tambahan (contoh: Dibayar tunai oleh pemilik kavling)..."
              class="w-full"
            />
          </UFormField>

          <!-- Upload Bukti Bayar -->
          <UFormField label="Bukti Bayar (Opsional)">
            <div class="w-full">
              <div
                v-if="proof"
                class="group relative aspect-video w-full max-h-48 overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
              >
                <img
                  :src="proof"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                >
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
                class="aspect-video max-h-48"
                icon="uil:image-upload"
                :ui="{ base: 'bg-neutral-100' }"
              />
            </div>
          </UFormField>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <UButton
          variant="ghost"
          color="neutral"
          label="Batal"
          @click="isOpen = false"
        />

        <div class="flex items-center gap-2">
          <UButton
            color="primary"
            icon="i-lucide-check-circle-2"
            :loading="submitting"
            :disabled="!previewData?.items?.length || loadingPreview"
            label="Proses & Lunaskan Pembayaran"
            @click="handleSubmit"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
