<script setup lang="ts">
import { formatCurrency } from '~/utils'

interface Props {
  modelValue: boolean
  editBill?: any
  defaultPersonId?: string
  defaultPersonName?: string
  defaultResidenceId?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'success'])

const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const isEditMode = computed(() => !!props.editBill)

// --- STATE ---
const loading = ref(false)
const loadingOptions = ref(false)

const residenceOptions = ref<{ key: string; label: string; pam_before?: number; pam_after?: number }[]>([])
const selectedResidenceId = ref<string>('')
const selectedMonth = ref<string>(new Date().toISOString().slice(0, 7)) // YYYY-MM
const pamBefore = ref<number>(0)
const pamAfter = ref<number>(0)
const pamPrice = ref<number>(3000)
const description = ref<string>('')

// Computed usage and total
const usageQty = computed(() => {
  const diff = (Number(pamAfter.value) || 0) - (Number(pamBefore.value) || 0)
  return Math.max(0, diff)
})

const totalAmount = computed(() => {
  return usageQty.value * (Number(pamPrice.value) || 3000)
})

// Fetch residences for the person or general dropdown
const fetchResidenceOptions = async () => {
  if (isEditMode.value) return

  loadingOptions.value = true
  try {
    if (props.defaultPersonId) {
      // Fetch person's linked residences
      const res = await useApi('/finance/bill/advance-options', {
        params: { person_id: props.defaultPersonId },
        method: 'GET'
      })
      if (res.status === 1 && res.data?.residences) {
        residenceOptions.value = res.data.residences.map((r: any) => ({
          key: r.id,
          label: `${r.type} No. ${r.kavling}`,
          pam_before: Number(r.pam_before) || 0,
          pam_after: Number(r.pam_after) || 0
        }))

        // Auto-select if matches default or single residence
        if (props.defaultResidenceId && residenceOptions.value.some(r => r.key === props.defaultResidenceId)) {
          selectedResidenceId.value = props.defaultResidenceId
        } else if (residenceOptions.value.length > 0 && residenceOptions.value[0]) {
          selectedResidenceId.value = residenceOptions.value[0].key
        }
        onResidenceChange()
      }
    } else {
      // General address dropdown
      const res = await useApi('/dropdown/address', { method: 'GET' })
      if (res.status === 1 && Array.isArray(res.data)) {
        residenceOptions.value = res.data.map((r: any) => ({
          key: r.key,
          label: r.label,
          pam_before: 0,
          pam_after: 0
        }))
      }
    }
  } catch (err) {
    console.error('Fetch residence options error:', err)
  } finally {
    loadingOptions.value = false
  }
}

// When residence selection changes, pre-fill pam_before
const onResidenceChange = () => {
  if (isEditMode.value) return
  const found = residenceOptions.value.find(r => r.key === selectedResidenceId.value)
  if (found) {
    const after = found.pam_after ?? 0
    const before = found.pam_before ?? 0
    pamBefore.value = after > 0 ? after : before
    if (pamAfter.value < pamBefore.value) {
      pamAfter.value = pamBefore.value
    }
  }
}

// Watch modal opening to initialize state
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (props.editBill) {
        // Edit Mode
        const bill = props.editBill
        selectedMonth.value = bill.bill_date ? bill.bill_date.slice(0, 7) : new Date().toISOString().slice(0, 7)
        pamBefore.value = Number(bill.pam_before) || 0
        pamAfter.value = Number(bill.pam_after) || 0
        pamPrice.value = Number(bill.price) || 3000
        description.value = bill.description || ''
        selectedResidenceId.value = bill.residence_id || ''
      } else {
        // Create Mode
        selectedMonth.value = new Date().toISOString().slice(0, 7)
        pamBefore.value = 0
        pamAfter.value = 0
        pamPrice.value = 3000
        description.value = ''
        selectedResidenceId.value = props.defaultResidenceId || ''
        fetchResidenceOptions()
      }
    }
  },
  { immediate: true }
)

const handleSubmit = async () => {
  if (!isEditMode.value && !selectedResidenceId.value) {
    toast.add({ title: 'Unit / Kavling wajib dipilih', color: 'error' })
    return
  }

  if (Number(pamAfter.value) < Number(pamBefore.value)) {
    toast.add({ title: 'Meter Akhir tidak boleh lebih kecil dari Meter Awal', color: 'error' })
    return
  }

  loading.value = true
  try {
    const billDateFormatted = `${selectedMonth.value}-01`

    if (isEditMode.value) {
      // Update existing bill
      const res = await useApi(`/finance/pdam/bill/${props.editBill.id}`, {
        method: 'PUT',
        body: {
          bill_date: billDateFormatted,
          pam_before: Number(pamBefore.value),
          pam_after: Number(pamAfter.value),
          price: Number(pamPrice.value),
          description: description.value || undefined
        }
      })

      if (res.status === 1) {
        toast.add({ title: 'Tagihan Air Artetis berhasil diperbarui', color: 'success' })
        emit('success')
        isOpen.value = false
      }
    } else {
      // Create manual bill
      const res = await useApi('/finance/pdam/manual', {
        method: 'POST',
        body: {
          residence_id: selectedResidenceId.value,
          bill_date: billDateFormatted,
          pam_before: Number(pamBefore.value),
          pam_after: Number(pamAfter.value),
          price: Number(pamPrice.value),
          description: description.value || undefined
        }
      })

      if (res.status === 1) {
        toast.add({ title: 'Tagihan Air Artetis berhasil dibuat', color: 'success' })
        emit('success')
        isOpen.value = false
      }
    }
  } catch (err: any) {
    console.error('Submit PAM error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="isOpen" :ui="{ content: 'max-w-lg' }">
    <template #header>
      <div class="flex items-center gap-2">
        <div class="p-2 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
          <UIcon name="i-lucide-droplets" class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-bold text-gray-900 text-base">
            {{ isEditMode ? 'Edit Tagihan Air Artetis' : 'Tambah Tagihan Air Artetis Manual' }}
          </h3>
          <p class="text-xs text-gray-500">
            {{ isEditMode ? 'Sesuaikan angka meteran untuk tagihan yang belum lunas' : 'Buat tagihan Air Artetis mandiri dengan kalkulasi otomatis' }}
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Target Info / Unit Selector -->
        <div v-if="isEditMode" class="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col gap-1">
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>Unit / Kavling:</span>
            <span class="font-bold text-gray-900 text-sm">
              {{ editBill.residence_type || editBill.residence?.type }} {{ editBill.residence_kavling || editBill.residence?.kavling }}
            </span>
          </div>
          <div v-if="defaultPersonName || editBill.person?.name" class="flex items-center justify-between text-xs text-gray-500">
            <span>Nama Penghuni:</span>
            <span class="font-semibold text-gray-800">
              {{ defaultPersonName || editBill.person?.name }}
            </span>
          </div>
        </div>

        <div v-else class="space-y-1">
          <label class="text-xs font-bold text-gray-700 uppercase">Pilih Unit / Kavling <span class="text-red-500">*</span></label>
          <USelect
            v-model="selectedResidenceId"
            :items="residenceOptions"
            value-key="key"
            label-key="label"
            placeholder="Pilih Unit Rumah..."
            class="w-full"
            :loading="loadingOptions"
            @update:model-value="onResidenceChange"
          />
          <span v-if="defaultPersonName" class="text-[11px] text-gray-500 block">
            Penghuni: <strong class="text-gray-800">{{ defaultPersonName }}</strong>
          </span>
        </div>

        <!-- Periode Bulan Tagihan -->
        <div class="space-y-1">
          <label class="text-xs font-bold text-gray-700 uppercase">Bulan Tagihan <span class="text-red-500">*</span></label>
          <UInput
            v-model="selectedMonth"
            type="month"
            class="w-full"
            required
          />
        </div>

        <!-- Meter Awal & Meter Akhir -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-xs font-bold text-gray-700 uppercase">Meter Awal (Bulan Lalu) <span class="text-red-500">*</span></label>
            <UInput
              v-model.number="pamBefore"
              type="number"
              step="any"
              min="0"
              placeholder="0"
              class="w-full font-mono font-semibold"
              required
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-gray-700 uppercase">Meter Akhir (Saat Ini) <span class="text-red-500">*</span></label>
            <UInput
              v-model.number="pamAfter"
              type="number"
              step="any"
              min="0"
              placeholder="0"
              class="w-full font-mono font-semibold"
              required
            />
          </div>
        </div>

        <!-- Tarif / m3 & Keterangan Opsional -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-xs font-bold text-gray-700 uppercase">Tarif per m³ (Rp)</label>
            <UInput
              v-model.number="pamPrice"
              type="number"
              step="any"
              min="0"
              class="w-full font-mono text-gray-700"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-gray-700 uppercase">Keterangan (Opsional)</label>
            <UInput
              v-model="description"
              type="text"
              placeholder="Tagihan Air Artetis..."
              class="w-full text-xs"
            />
          </div>
        </div>

        <!-- Live Calculation Card -->
        <div class="bg-gradient-to-br from-blue-50 to-sky-50 p-4 rounded-xl border border-blue-200 space-y-2">
          <div class="flex justify-between items-center text-xs text-blue-800">
            <span class="flex items-center gap-1.5 font-medium">
              <UIcon name="i-lucide-gauge" class="w-4 h-4 text-blue-600" />
              Volume Pemakaian Air
            </span>
            <span class="font-bold text-sm font-mono text-blue-950">
              {{ usageQty }} m³
            </span>
          </div>

          <div class="border-t border-blue-200/60 pt-2 flex justify-between items-center">
            <span class="text-xs font-bold text-blue-900 uppercase tracking-wider">Total Tagihan Air</span>
            <span class="text-lg font-black text-blue-700 font-mono">
              {{ formatCurrency(totalAmount) }}
            </span>
          </div>

          <div v-if="totalAmount === 0" class="text-[11px] text-emerald-700 flex items-center gap-1">
            <UIcon name="i-lucide-check-circle-2" class="w-3.5 h-3.5" />
            <span>Pemakaian 0 m³ akan otomatis berstatus <strong>Lunas (Rp 0)</strong>.</span>
          </div>
          <div v-else class="text-[11px] text-amber-700 flex items-center gap-1">
            <UIcon name="i-lucide-info" class="w-3.5 h-3.5" />
            <span>Tagihan akan berstatus <strong>Belum Lunas</strong> sampai warga membayar.</span>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="flex justify-end gap-2 pt-2">
          <UButton
            variant="ghost"
            color="neutral"
            :disabled="loading"
            @click="isOpen = false"
          >
            Batal
          </UButton>
          <UButton
            type="submit"
            color="primary"
            icon="i-lucide-check"
            :loading="loading"
          >
            {{ isEditMode ? 'Simpan Perubahan' : 'Buat Tagihan Air Artetis' }}
          </UButton>
        </div>
      </form>
    </template>
  </UModal>
</template>
