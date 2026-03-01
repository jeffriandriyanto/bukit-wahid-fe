<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { genderItems } from '~/const/dropdown'
import { fileUpload } from '~/services/files' // Pastikan path ini benar sesuai contohmu
import { watchWithFilter, debounceFilter } from '@vueuse/core'

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

const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingId = ref<string | null>(null)
const loading = ref(false)
const loadingEdit = ref(false)

// File Upload Refs
const avatarFile = ref<File | null>(null)
const signatureFile = ref<File | null>(null)
const search = ref('')
const dataCitizen = ref<any[]>([])
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

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
  // signature: '',
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
    // signature: '',
    job: '',
    religion: '',
    nationality: '',
    marital_status: '',
    last_education: ''
  })
}

// Logic untuk preview & bersihkan URL blob agar tidak memory leak
const clearFile = (type: 'avatar' | 'signature') => {
  if (type === 'avatar') {
    if (form.avatar?.startsWith('blob:')) URL.revokeObjectURL(form.avatar)
    form.avatar = ''
    avatarFile.value = null
  }
  // else {
  //   if (form.signature?.startsWith('blob:')) URL.revokeObjectURL(form.signature)
  //   form.signature = ''
  //   signatureFile.value = null
  // }
}

watch(avatarFile, (file) => {
  if (file) {
    if (form.avatar?.startsWith('blob:')) URL.revokeObjectURL(form.avatar)
    form.avatar = URL.createObjectURL(file)
  }
})

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

// watch(signatureFile, (file) => {
//   if (file) {
//     if (form.signature?.startsWith('blob:')) URL.revokeObjectURL(form.signature)
//     form.signature = URL.createObjectURL(file)
//   }
// })

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/resident', {
      params: {
        search: search.value,
        page: pagination.value.current_page,
        per_page: pagination.value.per_page
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
      // Pastikan data dari BE masuk ke form
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

    // 1. Handling Upload Avatar & Signature
    let finalAvatarUrl = form.avatar
    // let finalSignatureUrl = form.signature

    if (avatarFile.value) {
      const uploadRes = await fileUpload(avatarFile.value)
      if (uploadRes) finalAvatarUrl = uploadRes
    }

    // if (signatureFile.value) {
    //   const uploadRes = await fileUpload(signatureFile.value)
    //   if (uploadRes) finalSignatureUrl = uploadRes
    // }

    // 2. Prepare Payload
    const payload = {
      ...event.data,
      dob: formatDOB(event.data.dob || ''),
      avatar: finalAvatarUrl
      // signature: finalSignatureUrl
    }

    const url =
      mode.value === 'add' ? '/resident' : `/resident/${editingId.value}`
    const method = mode.value === 'add' ? 'POST' : 'PUT'

    const res = await useApi<any>(url, { method, body: payload })

    if (res.status === 1) {
      toast.add({
        title: `Berhasil ${
          mode.value === 'add' ? 'menambah' : 'mengubah'
        } data`,
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

// Update Kolom Tabel
const columnsFamilyTable = [
  { accessorKey: 'name', header: 'Informasi Warga' },
  { accessorKey: 'ttl', header: 'Tempat, Tgl Lahir' },
  { accessorKey: 'gender', header: 'L/P' },
  { accessorKey: 'blood_type', header: 'Gol. Darah', class: 'text-center' },
  { accessorKey: 'type', header: 'Status' },
  { id: 'action', header: 'Aksi', class: 'text-right' }
]

onMounted(() => {
  getData()
})
</script>

<template>
  <div class="space-y-4">
    <ConfirmDialog />

    <div
      class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4"
    >
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
      >
        <div class="w-full md:w-80">
          <UFormField>
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Cari Nama..."
              size="md"
              block
            />
          </UFormField>
        </div>

        <div class="flex gap-2">
          <!-- <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-download"
            label="Export"
          /> -->
          <UButton
            color="primary"
            icon="i-lucide-plus-circle"
            label="Tambah Warga"
            @click="openAddModal"
          />
        </div>
      </div>
    </div>

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
        <div>
          {{ row.original.blood_type || '-' }}
        </div>
      </template>

      <template #type-cell="{ row }">
        <div
          class="flex items-center gap-1.5 capitalize text-xs font-medium text-gray-600"
        >
          <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
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

            <!-- <UFormField name="signature" label="Tanda Tangan">
              <div v-if="form.signature" class="relative w-full h-24 mb-2">
                <img
                  :src="form.signature"
                  class="w-full h-full object-contain rounded-lg border bg-gray-50"
                />
                <UButton
                  size="xs"
                  color="error"
                  icon="i-lucide-x"
                  class="absolute -top-2 -right-2"
                  @click="clearFile('signature')"
                />
              </div>
              <UFileUpload v-else v-model="signatureFile" accept="image/*" />
            </UFormField> -->
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

    <div class="flex justify-end border-t border-default pt-4 px-4">
      <UPagination
        v-model:page="pagination.current_page"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        @update:page="getData"
      />
    </div>
  </div>
</template>
