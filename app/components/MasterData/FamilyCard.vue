<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const { dropdownRT, dropdownAddress, getDropdownRT, getDropdownAddress } =
  useApiDropdown()

// ===== 1. SCHEMAS =====
// Sekarang hanya menyimpan ID (string) dari master data citizen
const FamilyCardFormSchema = z.object({
  no_kk: z.string().min(1, 'No. Kartu keluarga wajib diisi'),
  rt: z.string().min(1, 'RT wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),
  head: z.string().min(1, 'Kepala Keluarga wajib dipilih'),
  spouse: z.string().optional().nullable(),
  childs: z.array(z.string()).default([])
})

type FamilyCardFormSchema = z.infer<typeof FamilyCardFormSchema>

// ===== 2. STATE =====
const { reveal: confirm } = useConfirmService()
const toast = useToast()

const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingId = ref<string | null>(null)
const loading = ref(false)
const loadingEdit = ref(false)

const dataFamilyCard = ref<any[]>([])
const residentDropdown = ref<{ key: string; label: string }[]>([])
const selectedRT = ref()

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

const form = reactive<FamilyCardFormSchema>({
  no_kk: '',
  rt: '',
  address: '',
  head: '',
  spouse: '',
  childs: []
})

// ===== 3. ACTIONS =====

const getResidentDropdown = async () => {
  try {
    // Unique=true untuk ambil orang yang belum punya keluarga
    const res = await useApi<any>('/dropdown/resident')
    if (res.status === 1) {
      residentDropdown.value = res.data
    }
  } catch (err) {
    console.error('Gagal mengambil data warga:', err)
  }
}

const resetForm = () => {
  editingId.value = null
  Object.assign(form, {
    no_kk: '',
    rt: '',
    address: '',
    head: '',
    spouse: '',
    childs: []
  })
}

const confirmDelete = async (id: string) => {
  const ok = await confirm({
    title: 'Hapus Data Keluarga?',
    description:
      'Data yang dihapus tidak dapat dikembalikan. Anggota keluarga di dalamnya akan kehilangan relasi kartu keluarga.',
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  try {
    loading.value = true
    const res = await useApi<any>(`/familly/${id}`, { method: 'DELETE' })

    if (res.status === 1) {
      toast.add({
        title: 'Data keluarga berhasil dihapus',
        color: 'success'
      })
      getData() // Refresh tabel
    }
  } catch (err: any) {
    toast.add({
      title: err?.message || 'Gagal menghapus data',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/familly/get', {
      params: {
        rt: selectedRT.value,
        page: pagination.value.current_page,
        per_page: pagination.value.per_page
      }
    })
    if (res.status === 1) {
      dataFamilyCard.value = res.data
      pagination.value = { ...res.pagination }
    }
  } finally {
    loading.value = false
  }
}

const openAddModal = async () => {
  resetForm()
  await getResidentDropdown() // Refresh dropdown saat mau tambah
  mode.value = 'add'
  isOpen.value = true
}

const openEditModal = async (row: any) => {
  loadingEdit.value = true
  resetForm()
  mode.value = 'edit'
  editingId.value = row.id

  try {
    // Saat edit, kita juga butuh dropdown resident.
    // Catatan: Jika BE unique=true, pastikan member yang sedang diedit tetap muncul di list.
    await getResidentDropdown()

    const res = await useApi<any>(`/familly/show/${row.id}`)
    if (res.status === 1) {
      const d = res.data
      form.no_kk = d.no_kk
      form.rt = d.rt
      await getDropdownAddress(d.rt)
      form.address = d.address

      // Map data dari object ke ID saja
      form.head = d.head?.id || d.head
      form.spouse = d.spouse?.id || d.spouse_id
      form.childs = d.childs?.map((c: any) => c.id) || []
    }
  } finally {
    isOpen.value = true
    loadingEdit.value = false
  }
}

const saveData = async (event: FormSubmitEvent<FamilyCardFormSchema>) => {
  try {
    loading.value = true
    // Payload disesuaikan dengan field yang diharapkan Backend (biasanya ID saja)
    const payload = {
      no_kk: event.data.no_kk,
      address: event.data.address,
      rt: event.data.rt,
      head: event.data.head,
      spouse: event.data.spouse || null,
      childs: event.data.childs
    }

    const url =
      mode.value === 'add' ? '/familly' : `/familly/${editingId.value}`
    const method = mode.value === 'add' ? 'POST' : 'PUT'
    console.log('payload', payload)

    const res = await useApi<any>(url, { method, body: payload })
    if (res.status === 1) {
      toast.add({ title: 'Berhasil menyimpan data keluarga', color: 'success' })
      isOpen.value = false
      getData()
    }
  } catch (err: any) {
    toast.add({ title: err?.message || 'Error', color: 'error' })
  } finally {
    loading.value = false
  }
}

const addressHandler = () => {
  form.address = ''
  getDropdownAddress(form.rt)
}

onMounted(() => {
  getDropdownRT()
  getData()
})

const columnsFamilyTable = [
  { accessorKey: 'head', header: 'Kepala Keluarga' },
  { accessorKey: 'total', header: 'Total Anggota' },
  { accessorKey: 'spouse', header: 'Pasangan' },
  { id: 'action', header: 'Aksi' }
]
</script>

<template>
  <div class="space-y-4 py-4">
    <ConfirmDialog />

    <div
      class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4"
    >
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
      >
        <USelectMenu
          v-model="selectedRT"
          placeholder="Filter RT"
          :items="dropdownRT"
          value-key="key"
          label-key="label"
          class="w-48"
          @change="getData"
        />
        <UButton
          color="neutral"
          icon="i-lucide-plus-circle"
          @click="openAddModal"
        >
          Tambah Keluarga
        </UButton>
      </div>
    </div>

    <UTable
      :data="dataFamilyCard"
      :columns="columnsFamilyTable"
      :loading="loading"
    >
      <template #action-cell="{ row }">
        <div class="flex gap-1">
          <UButton
            icon="i-lucide-pencil"
            variant="ghost"
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

    <UModal v-model:open="isOpen" :ui="{ content: 'min-w-2xl' }">
      <template #header>
        <span class="font-bold"
          >{{ mode === 'add' ? 'Tambah' : 'Edit' }} Keluarga</span
        >
      </template>

      <template #body>
        <UForm
          :schema="FamilyCardFormSchema"
          :state="form"
          class="space-y-6"
          @submit="saveData"
        >
          <UFormField name="no_kk" label="No. Kartu Keluarga" required>
            <UInput v-model="form.no_kk" placeholder="Masukkan No KK" />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField name="rt" label="RT" required>
              <USelect
                v-model="form.rt"
                :items="dropdownRT"
                value-key="key"
                label-key="label"
                @change="addressHandler"
              />
            </UFormField>
            <UFormField name="address" label="Alamat / Kavling" required>
              <USelect
                v-model="form.address"
                :disabled="!form.rt"
                :items="dropdownAddress"
                value-key="key"
                label-key="label"
              />
            </UFormField>
          </div>

          <UDivider label="Anggota Keluarga" />

          <div class="space-y-4">
            <UFormField name="head" label="Kepala Keluarga" required>
              <USelectMenu
                v-model="form.head"
                :items="residentDropdown"
                value-key="key"
                label-key="label"
                searchable
                placeholder="Cari Kepala Keluarga..."
              />
            </UFormField>

            <UFormField name="spouse" label="Pasangan (Istri/Suami)">
              <USelectMenu
                v-model="form.spouse"
                :items="residentDropdown"
                value-key="key"
                label-key="label"
                searchable
                placeholder="Cari Pasangan..."
                clearable
              />
            </UFormField>

            <UFormField name="childs" label="Daftar Anak">
              <USelectMenu
                v-model="form.childs"
                :items="residentDropdown"
                value-key="key"
                label-key="label"
                multiple
                searchable
                placeholder="Pilih Anak..."
              >
                <template #label>
                  <span v-if="form.childs.length"
                    >{{ form.childs.length }} Anak terpilih</span
                  >
                  <span v-else>Pilih Anak</span>
                </template>
              </USelectMenu>
            </UFormField>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t">
            <UButton variant="ghost" label="Batal" @click="isOpen = false" />
            <UButton
              type="submit"
              color="neutral"
              label="Simpan Keluarga"
              :loading="loading"
            />
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
