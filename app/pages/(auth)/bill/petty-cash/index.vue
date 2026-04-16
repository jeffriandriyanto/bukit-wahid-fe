<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { fileUpload } from '~/services/files'
import { perPageLimit } from '~/const/utils'

definePageMeta({ middleware: ['auth'] })

const toast = useToast()

// --- STATE ---
const dataPetty = ref([])
const loading = ref(false)
const isOpenDetail = ref(false)
const isOpenForm = ref(false)
const selectedDetail = ref<any>(null)

// Form State
const mode = ref<'in' | 'out' | 'revisi'>('in')
const editingId = ref<string | null>(null)
const imageFile = ref(null)

// Filter & Options
const searchQuery = ref('')
const selectedStatus = ref(null)
const statusOptions = ref<any[]>([{ key: null, label: 'Semua Status' }])
const coaOptions = ref<any[]>([]) // Diambil dari /dropdown/coa

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

// --- VALIDATION SCHEMA ---
const PettyFormSchema = z.object({
  tag: z.number().min(1, 'Tag/COA wajib dipilih'),
  amount: z.string().min(1, 'Nominal wajib diisi'),
  description: z.string().min(5, 'Deskripsi minimal 5 karakter'),
  date: z.string().optional(), // Muncul hanya saat revisi
  proof: z.string().min(1, 'Bukti transaksi wajib diunggah')
})

type PettyFormSchema = z.infer<typeof PettyFormSchema>

const form = reactive({
  tag: undefined as number | undefined,
  amount: '',
  description: '',
  date: '',
  proof: ''
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

const getOptions = async () => {
  try {
    const [statusRes, coaRes] = await Promise.all([
      useApi<any>('/dropdown/petty-status'),
      useApi<any>('/dropdown/coa')
    ])

    if (statusRes.status === 1) {
      statusOptions.value = [
        { key: null, label: 'Semua Status' },
        ...statusRes.data
      ]
    }
    if (coaRes.status === 1) {
      // mapping data COA sesuai respon API (key, label)
      coaOptions.value = coaRes.data
    }
  } catch (err) {
    console.error('Failed to fetch options:', err)
  }
}

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

const getDetail = async (id: string) => {
  try {
    const res = await useApi<any>(`/finance/petty-cash/${id}`)
    if (res.status === 1) {
      selectedDetail.value = res.data
      isOpenDetail.value = true
    }
  } catch (err) {
    console.error('Detail fetch error:', err)
  }
}

// Form Handlers
const openAddModal = (type: 'in' | 'out') => {
  resetFormFields()
  mode.value = type
  isOpenForm.value = true
}

const openRevisiModal = (row: any) => {
  resetFormFields()
  mode.value = 'revisi'
  editingId.value = row.id
  form.tag = row.tag
  form.amount = parseFloat(row.credit) > 0 ? row.credit : row.debit
  form.description = row.description
  form.date = row.date // format yyyy-mm-dd
  form.proof = row.proof

  isOpenForm.value = true
}

const resetFormFields = () => {
  form.tag = undefined
  form.amount = ''
  form.description = ''
  form.date = ''
  clearImage()
}

const clearImage = () => {
  if (form.proof?.startsWith('blob:')) URL.revokeObjectURL(form.proof)
  form.proof = ''
  imageFile.value = null
}

const saveData = async (event: FormSubmitEvent<PettyFormSchema>) => {
  loading.value = true
  try {
    let finalImageUrl = form.proof

    // Upload jika ada file baru
    if (imageFile.value) {
      const uploadRes = await fileUpload(imageFile.value)
      if (uploadRes) finalImageUrl = uploadRes
    }

    let url = ''
    let payload: any = {
      tag: event.data.tag,
      description: event.data.description,
      proof: finalImageUrl
    }

    if (mode.value === 'in') {
      url = '/finance/petty-cash/in'
      payload.debit = event.data.amount
    } else if (mode.value === 'out') {
      url = '/finance/petty-cash/out/open'
      payload.credit = event.data.amount
    } else if (mode.value === 'revisi') {
      url = `/finance/petty-cash/out/revisi/${editingId.value}`
      payload.date = event.data.date
      // Logika nominal revisi disesuaikan dengan tipe transaksi awal
      const isCredit = parseFloat(form.amount) > 0 // sederhananya dikirim sesuai input
      payload.credit = mode.value === 'revisi' ? event.data.amount : '0.00'
      payload.debit = '0.00'
    }

    const res = await useApi<any>(url, { method: 'POST', body: payload })

    if (res.status === 1) {
      toast.add({
        title: `Berhasil menyimpan Cash ${mode.value}`,
        color: 'success'
      })
      isOpenForm.value = false
      getData()
    }
  } catch (err: any) {
    toast.add({
      title: err?.data?.message || 'Gagal menyimpan data',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
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

// Watchers
watch(imageFile, (newFile) => {
  if (newFile) {
    if (form.proof?.startsWith('blob:')) URL.revokeObjectURL(form.proof)
    form.proof = URL.createObjectURL(newFile)
  }
})

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

      <div class="flex flex-wrap items-center gap-3">
        <div class="w-64">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari Tag / Deskripsi..."
            @keyup.enter="getData"
          />
        </div>
        <USelect
          v-model="selectedStatus"
          :items="statusOptions"
          label-key="label"
          value-key="key"
          class="w-44"
          @update:model-value="getData"
        />
        <UButton
          color="success"
          icon="i-heroicons-arrow-down-left"
          @click="openAddModal('in')"
          >Cash In</UButton
        >
        <UButton
          color="error"
          icon="i-heroicons-arrow-up-right"
          @click="openAddModal('out')"
          >Cash Out</UButton
        >
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
          <div class="text-[10px] text-gray-400 italic">
            {{ formatDateTime(row.original.created_at) }}
          </div>
        </template>

        <template #coa-cell="{ row }">
          <div class="font-bold text-primary-700">#{{ row.original.tag }}</div>
          <div class="text-xs text-gray-500">
            {{ row.original.coa?.name || 'Tanpa Kategori' }}
          </div>
        </template>

        <template #amount-cell="{ row }">
          <div
            v-if="parseFloat(row.original.credit) > 0"
            class="text-red-600 font-semibold"
          >
            - {{ formatCurrency(row.original.credit) }}
          </div>
          <div
            v-else-if="parseFloat(row.original.debit) > 0"
            class="text-green-600 font-semibold"
          >
            + {{ formatCurrency(row.original.debit) }}
          </div>
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
          <div class="flex gap-1">
            <UButton
              icon="i-heroicons-eye"
              variant="ghost"
              color="neutral"
              @click="getDetail(row.original.id)"
            />
            <UButton
              v-if="row.original.status === 'reject'"
              icon="i-heroicons-pencil-square"
              variant="ghost"
              color="warning"
              @click="openRevisiModal(row.original)"
            />
          </div>
        </template>
      </UTable>
    </div>

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

    <UModal v-model:open="isOpenForm" :ui="{ width: 'sm:max-w-lg' }">
      <template #header>
        <div class="flex items-center gap-2 font-bold text-gray-800">
          <UIcon
            :name="
              mode === 'in'
                ? 'i-heroicons-arrow-down-left'
                : 'i-heroicons-arrow-up-right'
            "
            :class="mode === 'in' ? 'text-green-500' : 'text-red-500'"
          />
          <span class="capitalize">{{
            mode === 'revisi' ? 'Revisi Transaksi' : `Input Cash ${mode}`
          }}</span>
        </div>
      </template>

      <template #body>
        <UForm
          :schema="PettyFormSchema"
          :state="form"
          class="space-y-5"
          @submit="saveData"
        >
          <UFormField name="tag" label="Tag / COA" required>
            <USelectMenu
              v-model="form.tag"
              :items="coaOptions"
              label-key="label"
              value-key="key"
              placeholder="Pilih Akun/Tag"
              searchable
              size="lg"
            />
          </UFormField>

          <UFormField
            v-if="mode === 'revisi'"
            name="date"
            label="Tanggal Transaksi"
          >
            <UInput v-model="form.date" type="date" size="lg" />
          </UFormField>

          <UFormField name="amount" label="Nominal" required>
            <UInput
              v-model="form.amount"
              placeholder="0"
              size="lg"
            >
              <template #leading>
                <span class="text-gray-400 text-xs font-bold">Rp</span>
              </template>
            </UInput>
          </UFormField>

          <UFormField name="description" label="Keterangan" required>
            <UTextarea
              v-model="form.description"
              placeholder="Jelaskan keperluan transaksi secara detail..."
              :rows="3"
            />
          </UFormField>

          <UFormField name="proof" label="Bukti Transaksi" required>
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
            <UButton variant="ghost" color="neutral" @click="isOpenForm = false"
              >Batal</UButton
            >
            <UButton
              type="submit"
              color="primary"
              :loading="loading"
              class="px-8"
            >
              Simpan Transaksi
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <UModal v-model:open="isOpenDetail" :ui="{ content: 'sm:max-w-3xl' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="font-bold text-gray-900">Rincian Transaksi Petty Cash</h3>
          <UBadge :color="getStatusColor(selectedDetail?.status)">{{
            getStatusLabel(selectedDetail?.status)
          }}</UBadge>
        </div>
      </template>
      <template #body>
        <div v-if="selectedDetail" class="space-y-6">
          <div
            class="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100"
          >
            <div>
              <p
                class="text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              >
                Tanggal
              </p>
              <p class="font-semibold text-sm">
                {{ formatDate(selectedDetail.date) }}
              </p>
            </div>
            <div>
              <p
                class="text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              >
                Tag / COA
              </p>
              <p class="font-semibold text-sm">#{{ selectedDetail.tag }}</p>
            </div>
            <div class="col-span-2">
              <p
                class="text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              >
                Nominal
              </p>
              <p
                :class="[
                  'text-xl font-black',
                  parseFloat(selectedDetail.credit) > 0
                    ? 'text-red-600'
                    : 'text-green-600'
                ]"
              >
                {{
                  formatCurrency(
                    parseFloat(selectedDetail.credit) > 0
                      ? selectedDetail.credit
                      : selectedDetail.debit
                  )
                }}
              </p>
            </div>
          </div>

          <div>
            <p class="text-sm font-bold text-gray-900 mb-2">
              Keterangan / Deskripsi:
            </p>
            <div
              class="p-4 bg-white border border-gray-100 rounded-xl text-sm text-gray-600 italic leading-relaxed"
            >
              "{{ selectedDetail.description }}"
            </div>
          </div>

          <div v-if="selectedDetail.proof">
            <p
              class="text-sm font-bold text-gray-900 mb-2 text-center md:text-left"
            >
              Bukti Lampiran:
            </p>
            <div
              class="max-w-md mx-auto md:mx-0 overflow-hidden rounded-2xl border shadow-sm"
            >
              <img :src="selectedDetail.proof" class="w-full h-auto" />
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
/* Menghilangkan spin button di input number */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
