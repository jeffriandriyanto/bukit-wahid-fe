<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { genderItems } from '~/const/dropdown'
import { fileUpload, fileUploadResidence } from '~/services/files'
import { watchWithFilter, debounceFilter } from '@vueuse/core'
import { perPageLimit } from '~/const/utils'

// ===== 1. SCHEMAS =====

const CitizenFromSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  phone: z.string().optional().nullable(),
  gender: z.enum(['L', 'P']),
  blood_type: z.string().optional().nullable(),
  dob: z.any().optional().nullable(),
  pob: z.string().optional().nullable(),
  nik: z.string().optional().nullable(),
  no_kk: z.string().optional().nullable(),
  email: z.string().email('Format email salah').optional().nullable(),
  avatar: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  job: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  marital_status: z.string().optional().nullable(),
  last_education: z.string().optional().nullable()
})

type CitizenFromSchema = z.infer<typeof CitizenFromSchema>

// ===== 2. STATE =====

const { reveal: confirm } = useConfirmService()
const toast = useToast()
const { dropdownRT, getDropdownRT } = useApiDropdown()

const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingId = ref<string | null>(null)
const loading = ref(false)
const loadingEdit = ref(false)

// File Upload Refs
const avatarFile = ref<File | null>(null)
const signatureFile = ref<File | null>(null)

// Search & Filter States
const search = ref('')
const selectedRT = ref(null)
const selectedAgeGroup = ref(null)
const selectedReligion = ref(null)

// --- Temporary States (Yang nempel di Dropdown Modal) ---
const tempRT = ref(null)
const tempAgeGroup = ref(null)
const tempReligion = ref(null)

const isFilterModalOpen = ref(false)

const dataCitizen = ref<any[]>([])
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

const religionOptions = [
  { key: null, label: 'Semua Agama' },
  { key: 'Islam', label: 'Islam' },
  { key: 'Kristen', label: 'Kristen' },
  { key: 'Katolik', label: 'Katolik' },
  { key: 'Hindu', label: 'Hindu' },
  { key: 'Budha', label: 'Budha' },
  { key: 'Khonghucu', label: 'Khonghucu' }
]

const ageGroupOptions = [
  { key: null, label: 'Semua Usia' },
  { key: '0-5', label: '0 - 5 Tahun' },
  { key: '6-12', label: '6 - 12 Tahun' },
  { key: '13-16', label: '13 - 16 Tahun' },
  { key: '17-21', label: '17 - 21 Tahun' },
  { key: '22-40', label: '22 - 40 Tahun' },
  { key: '41-59', label: '41 - 59 Tahun' },
  { key: '60', label: '>= 60 Tahun' }
]

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedRT.value) count++
  if (selectedAgeGroup.value) count++
  if (selectedReligion.value) count++
  return count
})

const applyFilters = () => {
  selectedRT.value = tempRT.value
  selectedAgeGroup.value = tempAgeGroup.value
  selectedReligion.value = tempReligion.value

  pagination.value.current_page = 1
  getData()
  isFilterModalOpen.value = false
}

const resetFilters = () => {
  tempRT.value = null
  tempAgeGroup.value = null
  tempReligion.value = null

  selectedRT.value = null
  selectedAgeGroup.value = null
  selectedReligion.value = null

  search.value = ''
  pagination.value.current_page = 1
  getData()
  isFilterModalOpen.value = false
}

const form = reactive<CitizenFromSchema>({
  name: '',
  phone: '',
  gender: 'L',
  blood_type: '',
  pob: '',
  dob: null,
  nik: '',
  no_kk: '',
  email: '',
  avatar: '',
  job: '',
  religion: '',
  nationality: '',
  marital_status: '',
  last_education: ''
})

// ===== 3. ACTIONS =====

const resetForm = () => {
  editingId.value = null
  avatarFile.value = null
  signatureFile.value = null
  Object.assign(form, {
    name: '',
    phone: '',
    gender: 'L',
    blood_type: '',
    pob: '',
    dob: null,
    nik: '',
    no_kk: '',
    email: '',
    avatar: '',
    job: '',
    religion: '',
    nationality: '',
    marital_status: '',
    last_education: ''
  })
}

const clearFile = (type: 'avatar' | 'signature') => {
  if (type === 'avatar') {
    if (form.avatar?.startsWith('blob:')) URL.revokeObjectURL(form.avatar)
    form.avatar = ''
    avatarFile.value = null
  }
}

watch(avatarFile, (file) => {
  if (file) {
    if (form.avatar?.startsWith('blob:')) URL.revokeObjectURL(form.avatar)
    form.avatar = URL.createObjectURL(file)
  }
})

// Watchers for Filters
const handleFilterChange = () => {
  pagination.value.current_page = 1
  getData()
}

watchWithFilter(
  search,
  () => {
    pagination.value.current_page = 1
    getData()
  },
  { eventFilter: debounceFilter(1000) }
)

watchWithFilter(
  search,
  () => {
    handleFilterChange()
  },
  {
    eventFilter: debounceFilter(1000)
  }
)

// --- EXCEL ACTIONS ---
const excelInput = ref<HTMLInputElement | null>(null)
const loadingExcel = ref(false)

const downloadTemplateHandler = () => {
  const config = useRuntimeConfig()
  const url = `${config.public.baseUrl}resident/excel/template`
  window.open(url, '_blank')
}

const downloadExportHandler = () => {
  const config = useRuntimeConfig()
  // Generate query params based on active filters
  const params = new URLSearchParams({
    search: search.value || '',
    rt: selectedRT.value || '',
    age_group: selectedAgeGroup.value || '',
    religion: selectedReligion.value || ''
  })
  const url = `${config.public.baseUrl}resident/excel/export?${params.toString()}`
  window.open(url, '_blank')
}

const triggerExcelUpload = () => excelInput.value?.click()

const handleExcelChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    loadingExcel.value = true
    const res = await fileUploadResidence(file)

    if (res?.status === 1) {
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

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/resident', {
      params: {
        search: search.value,
        rt: selectedRT.value,
        age_group: selectedAgeGroup.value,
        religion: selectedReligion.value,
        page: pagination.value.current_page,
        limit: pagination.value.per_page
      },
      method: 'GET'
    })

    if (res.status === 1) {
      dataCitizen.value = res.data
      pagination.value = { ...res.pagination }
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  resetForm()
  mode.value = 'add'
  isOpen.value = true
}

const openEditModal = async (row: any) => {
  loadingEdit.value = true
  resetForm()
  mode.value = 'edit'
  editingId.value = row.id

  try {
    const res = await useApi<any>(`/resident/${row.id}`)
    if (res.status === 1) {
      Object.assign(form, { ...res.data, dob: parseToCalendarDate(row.dob) })
    }
  } catch (err) {
    toast.add({ title: 'Gagal mengambil detail data', color: 'error' })
  } finally {
    isOpen.value = true
    loadingEdit.value = false
  }
}

const saveData = async (event: FormSubmitEvent<CitizenFromSchema>) => {
  try {
    loading.value = true
    let finalAvatarUrl = form.avatar

    if (avatarFile.value) {
      const uploadRes = await fileUpload(avatarFile.value)
      if (uploadRes) finalAvatarUrl = uploadRes
    }

    const payload = {
      ...event.data,
      dob: formatDOB(event.data.dob || ''),
      avatar: finalAvatarUrl
    }

    const url =
      mode.value === 'add' ? '/resident' : `/resident/${editingId.value}`
    const method = mode.value === 'add' ? 'POST' : 'PUT'

    const res = await useApi<any>(url, { method, body: payload })

    if (res.status === 1) {
      toast.add({
        title: `Berhasil ${mode.value === 'add' ? 'menambah' : 'mengubah'} data`,
        color: 'success'
      })
      isOpen.value = false
      getData()
    }
  } catch (err: any) {
    toast.add({
      title: err?.message || 'Terjadi kesalahan server',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const confirmDelete = async (id: string) => {
  const ok = await confirm({
    title: 'Hapus Data Warga?',
    description: 'Data yang dihapus tidak dapat dikembalikan.',
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  try {
    loading.value = true
    const res = await useApi<any>(`/resident/${id}`, { method: 'DELETE' })
    if (res.status === 1) {
      toast.add({ title: 'Data berhasil dihapus', color: 'success' })
      getData()
    }
  } catch (err: any) {
    toast.add({ title: err?.message || 'Gagal menghapus data', color: 'error' })
  } finally {
    loading.value = false
  }
}

const getAge = (dob: string | null) => {
  if (!dob) return '-'
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

const columnsFamilyTable = [
  { accessorKey: 'name', header: 'Informasi Warga' },
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'ttl', header: 'Tempat, Tgl Lahir' },
  { accessorKey: 'gender', header: 'L/P' },
  { accessorKey: 'blood_type', header: 'Gol. Darah', class: 'text-center' },
  { accessorKey: 'type', header: 'Status' },
  { id: 'action', header: 'Aksi', class: 'text-right' }
]

watch(
  () => pagination.value.per_page,
  () => {
    pagination.value.current_page = 1
    getData()
  }
)

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

    <SharedHeaderBg>
      <div
        class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full py-2"
      >
        <div class="flex items-center gap-4 shrink-0">
          <div
            class="p-3 bg-primary-50 rounded-2xl border border-primary-100/50"
          >
            <UIcon
              name="i-lucide-user-circle-2"
              class="w-6 h-6 text-primary-600 block"
            />
          </div>
          <div class="flex flex-col">
            <h2
              class="text-xl font-black text-neutral-900 tracking-tight leading-none"
            >
              Data Penduduk
            </h2>
            <span
              class="text-[10px] text-neutral-400 uppercase font-black tracking-widest mt-1.5"
            >
              Bukit Wahid Regency
            </span>
          </div>
        </div>

        <div class="flex flex-1 items-center gap-2 max-w-xl">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Cari nama..."
            size="lg"
            class="flex-1"
            :ui="{ root: 'rounded-full' }"
          />

          <UButton
            color="neutral"
            variant="soft"
            size="lg"
            class="rounded-full px-5 font-bold shrink-0 relative"
            @click="isFilterModalOpen = true"
          >
            <template #leading>
              <UIcon name="i-lucide-filter" class="w-4 h-4" />
            </template>
            Filter
            <UBadge
              v-if="activeFilterCount > 0"
              color="primary"
              size="xs"
              class="ml-1 rounded-full px-1.5 min-w-[20px] justify-center"
            >
              {{ activeFilterCount }}
            </UBadge>
          </UButton>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-file-spreadsheet"
            size="md"
            class="rounded-full font-bold hidden sm:flex"
            @click="downloadExportHandler"
          >
            Export
          </UButton>

          <div class="h-6 w-px bg-neutral-200 mx-1 hidden sm:block"></div>

          <UButton
            color="primary"
            icon="i-lucide-plus-circle"
            size="lg"
            class="rounded-full px-6 shadow-lg shadow-primary-500/20 font-bold"
            @click="openAddModal"
          >
            <span class="hidden sm:inline">Tambah Warga</span>
          </UButton>
        </div>
      </div>
    </SharedHeaderBg>

    <UModal
      v-model:open="isFilterModalOpen"
      :ui="{ content: 'max-w-md', rounded: 'rounded-4xl' }"
    >
      <template #header>
        <div
          class="flex items-center gap-2 font-black text-neutral-900 uppercase tracking-tight"
        >
          <UIcon name="i-lucide-sliders-horizontal" class="text-primary-600" />
          Filter Pencarian
        </div>
      </template>

      <template #body>
        <div class="space-y-6">
          <UFormField label="Berdasarkan Wilayah RT">
            <USelectMenu
              v-model="selectedRT"
              :items="dropdownRT"
              value-key="key"
              label-key="label"
              placeholder="Semua RT"
              size="xl"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Berdasarkan Kelompok Usia">
            <USelectMenu
              v-model="selectedAgeGroup"
              :items="ageGroupOptions"
              value-key="key"
              label-key="label"
              placeholder="Semua Usia"
              size="xl"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Berdasarkan Agama">
            <USelectMenu
              v-model="selectedReligion"
              :items="religionOptions"
              value-key="key"
              label-key="label"
              placeholder="Semua Agama"
              size="xl"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-between w-full">
          <UButton
            label="Reset Filter"
            color="error"
            variant="ghost"
            class="font-bold"
            @click="resetFilters"
          />
          <UButton
            label="Terapkan"
            color="primary"
            class="rounded-xl px-8 font-black uppercase tracking-widest"
            @click="isFilterModalOpen = false"
          />
        </div>
      </template>
    </UModal>

    <div
      class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <UTable
        :data="dataCitizen"
        :columns="columnsFamilyTable"
        :loading="loading"
      >
        <template #name-cell="{ row }">
          <div class="flex items-center gap-3 py-1">
            <UAvatar
              :src="row.original.avatar"
              :alt="row.original.name"
              size="md"
              class="bg-gray-100"
            />
            <div class="flex flex-col">
              <span class="font-bold text-gray-900 leading-tight">{{
                row.original.name
              }}</span>
              <span class="text-xs text-gray-500"
                >{{ getAge(row.original.dob) }} Tahun</span
              >
            </div>
          </div>
        </template>

        <template #ttl-cell="{ row }">
          <div class="flex flex-col text-sm">
            <span class="text-gray-700 font-medium">{{
              row.original.pob || '-'
            }}</span>
            <span class="text-xs text-gray-400">
              {{
                row.original.dob
                  ? new Date(row.original.dob).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  : '-'
              }}
            </span>
          </div>
        </template>

        <template #gender-cell="{ row }">
          <UBadge
            v-if="row.original.gender"
            :color="row.original.gender === 'L' ? 'primary' : 'secondary'"
            variant="soft"
            size="sm"
            class="font-bold"
          >
            {{ row.original.gender === 'L' ? 'Laki-laki' : 'Perempuan' }}
          </UBadge>
          <span v-else>-</span>
        </template>

        <template #blood_type-cell="{ row }">
          <div>{{ row.original.blood_type || '-' }}</div>
        </template>

        <template #type-cell="{ row }">
          <div
            class="flex items-center gap-1.5 capitalize text-xs font-medium text-gray-600"
          >
            <div class="w-1.5 h-1.5 rounded-full bg-green-500" />
            {{ row.original.type }}
          </div>
        </template>

        <template #action-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UTooltip text="Edit Data">
              <UButton
                icon="i-lucide-pencil"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="openEditModal(row.original)"
              />
            </UTooltip>
            <UTooltip text="Hapus Data">
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                color="error"
                size="sm"
                @click="confirmDelete(row.original.id)"
              />
            </UTooltip>
          </div>
        </template>
      </UTable>
    </div>

    <UModal v-model:open="isOpen" :ui="{ content: 'min-w-4xl' }">
      <template #header>
        <span class="font-bold"
          >{{ mode === 'add' ? 'Tambah' : 'Edit' }} Data Warga</span
        >
      </template>

      <template #body>
        <UForm
          :schema="CitizenFromSchema"
          :state="form"
          class="space-y-6"
          @submit="saveData"
        >
          <div class="grid grid-cols-2 gap-4">
            <UFormField name="nik" label="NIK">
              <UInput v-model="form.nik" placeholder="32xxxxxxxxxxxx" />
            </UFormField>
            <UFormField name="no_kk" label="Nomor KK">
              <UInput v-model="form.no_kk" placeholder="32xxxxxxxxxxxx" />
            </UFormField>
            <UFormField name="name" label="Nama Lengkap" required>
              <UInput v-model="form.name" />
            </UFormField>
            <UFormField name="email" label="Email">
              <UInput v-model="form.email" type="email" />
            </UFormField>
            <UFormField name="phone" label="No. Telepon">
              <UInput v-model="form.phone" />
            </UFormField>
            <UFormField name="gender" label="Jenis Kelamin">
              <USelect
                v-model="form.gender"
                :items="genderItems"
                value-key="key"
              />
            </UFormField>
            <UFormField name="pob" label="Tempat Lahir">
              <UInput v-model="form.pob" />
            </UFormField>
            <UFormField name="dob" label="Tanggal Lahir">
              <UInputDate v-model="form.dob" />
            </UFormField>
            <UFormField name="blood_type" label="Golongan Darah">
              <UInput v-model="form.blood_type" />
            </UFormField>
            <UFormField name="job" label="Pekerjaan">
              <UInput v-model="form.job" />
            </UFormField>

            <UFormField name="avatar" label="Foto Profil (Avatar)">
              <div v-if="form.avatar" class="relative w-32 h-32 mb-2">
                <img
                  :src="form.avatar"
                  class="w-full h-full object-cover rounded-lg border"
                />
                <UButton
                  size="xs"
                  color="error"
                  icon="i-lucide-x"
                  class="absolute -top-2 -right-2"
                  @click="clearFile('avatar')"
                />
              </div>
              <UFileUpload v-else v-model="avatarFile" accept="image/*" />
            </UFormField>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t">
            <UButton variant="ghost" label="Batal" @click="isOpen = false" />
            <UButton
              type="submit"
              color="neutral"
              label="Simpan Data"
              :loading="loading"
            />
          </div>
        </UForm>
      </template>
    </UModal>

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
        @update:page="getData"
      />
    </div>
  </div>
</template>
