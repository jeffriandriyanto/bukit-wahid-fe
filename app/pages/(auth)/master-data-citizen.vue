<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { genderItems } from '~/const/dropdown'

// ===== 1. SCHEMAS =====

const CitizenFromSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  phone: z.string(),
  gender: z.enum(['L', 'P']),
  blood_type: z.string(),
  dob: z.any(),
  pob: z.string()
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

const dataCitizen = ref<any[]>([])
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

// const todayDate = shallowRef(toCalendarDate(today(getLocalTimeZone())))

const form = reactive<CitizenFromSchema>({
  name: '',
  phone: '',
  gender: 'L',
  blood_type: '',
  pob: '',
  dob: null
})

// ===== 3. ACTIONS =====
const resetForm = () => {
  editingId.value = null
  Object.assign(form, {
    name: '',
    phone: '',
    gender: 'L',
    blood_type: '',
    pob: '',
    dob: null
  })
}

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/citizen/get', {
      params: {
        page: pagination.value.current_page,
        per_page: pagination.value.per_page
      },
      method: 'GET'
    })

    if (res.status === 1) {
      dataCitizen.value = res.data
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
    const res = await useApi<any>(`/citizen/show/${row.id}`)

    if (res.status === 1) {
      Object.assign(form, { ...res.data })
    }
  } catch (err) {
    console.error('Error fetching detail:', err)
    toast.add({ title: 'Gagal mengambil detail data', color: 'error' })
  } finally {
    isOpen.value = true
    loadingEdit.value = false
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
    const res = await useApi<any>(`/citizen/${id}`, { method: 'DELETE' })
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

const saveData = async (event: FormSubmitEvent<CitizenFromSchema>) => {
  try {
    loading.value = true
    const url =
      mode.value === 'add' ? '/citizen' : `/citizen/${editingId.value}`
    const method = mode.value === 'add' ? 'POST' : 'PUT'

    const res = await useApi<any>(url, { method, body: event.data })

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

onMounted(() => {
  getData()
})

const columnsFamilyTable = [
  { accessorKey: 'name', header: 'Nama' },
  { accessorKey: 'phone', header: 'No. Telp' },
  { accessorKey: 'gender', header: 'Jenis Kelamin' },
  { accessorKey: 'pob', header: 'Tempat Lahir' },
  { accessorKey: 'dob', header: 'Tanggal Lahir' },
  { accessorKey: 'blood_type', header: 'Gol. Darah' },
  { id: 'action', header: 'Aksi' }
]
</script>

<template>
  <div class="space-y-4">
    <ConfirmDialog />

    <div class="flex justify-end items-center mt-4">
      <UButton
        color="neutral"
        icon="i-lucide-plus-circle"
        @click="openAddModal"
      >
        Tambah Data Warga
      </UButton>
    </div>

    <UTable
      ref="table"
      :data="dataCitizen"
      :columns="columnsFamilyTable"
      :loading="loading"
    >
      <template #head-cell="{ row }">
        <div class="font-bold text-neutral-900">{{ row.original.head }}</div>
      </template>

      <template #action-cell="{ row }">
        <div class="flex gap-1">
          <UButton
            icon="i-lucide-pencil"
            variant="ghost"
            color="neutral"
            @click="openEditModal(row.original)"
          />
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            @click="confirmDelete(row.original.id)"
          />
        </div>
      </template>
    </UTable>

    <div class="flex justify-end border-t border-default pt-4 px-4">
      <UPagination
        v-model:page="pagination.current_page"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        :max="5"
        @update:page="getData"
      />
    </div>

    <UModal v-model:open="isOpen" :ui="{ content: 'min-w-3xl' }">
      <template #header>
        <span class="font-bold"
          >{{ mode === 'add' ? 'Tambah' : 'Edit' }} Data Warga</span
        >
      </template>

      <template #body>
        <UForm
          :schema="CitizenFromSchema"
          :state="form"
          class="space-y-6 w-full"
          @submit="saveData"
        >
          <div class="grid grid-cols-2 gap-3">
            <UFormField name="name" label="Nama" required>
              <UInput v-model="form.name" placeholder="Nama" />
            </UFormField>
            <UFormField name="phone" label="No. Telepon">
              <UInput v-model="form.phone" placeholder="No. Telepon" />
            </UFormField>
            <UFormField name="gender" label="Jenis Kelamin">
              <USelect
                v-model="form.gender"
                :items="genderItems"
                value-key="key"
              />
            </UFormField>
            <UFormField name="pob" label="Tempat Lahir">
              <UInput v-model="form.pob" placeholder="Tempat Lahir" />
            </UFormField>
            <UFormField name="dob" label="Tanggal Lahir">
              <UInputDate v-model="form.dob" />
            </UFormField>
            <UFormField name="blood_type" label="Golongan Darah">
              <UInput v-model="form.blood_type" placeholder="Golongan Darah" />
            </UFormField>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <UButton
              :loading="loadingEdit"
              variant="ghost"
              label="Batal"
              @click="isOpen = false"
            />
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
  </div>
</template>
