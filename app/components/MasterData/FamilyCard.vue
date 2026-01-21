<script setup lang="ts">
import { z } from 'zod'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { FormSubmitEvent } from '@nuxt/ui'
import { genderItems } from '~/const/dropdown'
const {
  dropdownRT,
  dropdownAddress,
  getDropdownRT,
  getDropdownAddress
} = useApiDropdown()

// ===== 1. SCHEMAS =====
const FamilyCardFormSchema = z.object({
  no_kk: z.string().min(1, 'No. Kartu keluarga wajib diisi'),
  rt: z.number().nullable(),
  address_id: z.string().min(1, 'Alamat wajib diisi'),
  head: z.object({
    name: z.string().min(1, 'Nama wajib diisi'),
    phone: z.string().min(10, 'Nomor telepon tidak valid'),
    gender: z.enum(['L', 'P'])
  }),
  spouse: z.object({
    name: z.string().min(1, 'Nama Pasangan wajib diisi'),
    phone: z.string().min(10, 'Nomor telepon tidak valid'),
    gender: z.enum(['L', 'P'])
  }),
  childs: z.array(
    z.object({
      name: z.string().min(1, 'Nama Anak wajib diisi'),
      phone: z.string().optional(),
      gender: z.enum(['L', 'P'])
    })
  )
})

type FamilyCardFormSchema = z.infer<typeof FamilyCardFormSchema>

// ===== 2. STATE =====
const { reveal: confirm } = useConfirmService()
const toast = useToast()
// const tableFamilyCard = useTemplateRef('table')

const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingId = ref<string | null>(null)
const loading = ref(false)

const dataFamilyCard = ref<any[]>([])
const selectedRT = ref()
const pagination = ref({ pageIndex: 0, pageSize: 10 })

const form = reactive<FamilyCardFormSchema>({
  no_kk: '',
  rt: null,
  address_id: '',
  head: { name: '', phone: '', gender: 'L' },
  spouse: { name: '', phone: '', gender: 'P' },
  childs: []
})

// ===== 3. ACTIONS =====
const resetForm = () => {
  editingId.value = null
  Object.assign(form, {
    no_kk: '',
    rt: null,
    address_id: '',
    head: { name: '', phone: '', gender: 'L' },
    spouse: { name: '', phone: '', gender: 'P' },
    childs: []
  })
}

const getData = async () => {
  try {
    const res = await useApi<any>('/familly/get', {
      params: { rt: selectedRT.value },
      method: 'GET'
    })
    if (res.status === 1) dataFamilyCard.value = res.data
  } catch (err) {
    console.error('Fetch error:', err)
  }
}

const openAddModal = () => {
  resetForm()
  mode.value = 'add'
  isOpen.value = true
}

const openEditModal = (row: any) => {
  resetForm()
  mode.value = 'edit'
  editingId.value = row.id

  form.no_kk = row.no_kk
  form.rt = row.rt
  form.address_id = row.address?.id || ''

  // Mapping String to Object
  form.head = { name: row.head, phone: '', gender: 'L' }
  form.spouse = { name: row.spouse, phone: '', gender: 'P' }
  form.childs = row.childs.map((name: string) => ({
    name,
    phone: '',
    gender: 'L'
  }))

  isOpen.value = true
}

const confirmDelete = async (id: string) => {
  const ok = await confirm({
    title: 'Hapus Data Keluarga?',
    description: 'Data yang dihapus tidak dapat dikembalikan.',
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  try {
    loading.value = true
    const res = await useApi<any>(`/familly/${id}`, { method: 'DELETE' })
    if (res.status === 1) {
      toast.add({ title: 'Data berhasil dihapus', color: 'success' })
      getData()
    }
  } catch (err) {
    toast.add({ title: 'Gagal menghapus data', color: 'error' })
  } finally {
    loading.value = false
  }
}

const saveData = async (event: FormSubmitEvent<FamilyCardFormSchema>) => {
  const payload = {
    no_kk: event.data.no_kk || null,
    address: event.data.address_id,
    head: event.data.head,
    spouse: event.data.spouse,
    childs: event.data.childs
  }

  try {
    loading.value = true
    const url =
      mode.value === 'add' ? '/familly' : `/familly/${editingId.value}`
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
  } catch (err) {
    toast.add({ title: 'Terjadi kesalahan server', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getDropdownRT()
  getData()
})

const columnsFamilyTable = [
  { accessorKey: 'head', header: 'Kepala Keluarga' },
  { accessorKey: 'total', header: 'Total Anggota' },
  { accessorKey: 'spouse', header: 'Pasangan' },
  { accessorKey: 'childs', header: 'Anak' },
  { id: 'action', header: 'Aksi' }
]
</script>

<template>
  <div class="space-y-4">
    <ConfirmDialog />

    <div class="flex justify-between items-center mt-4">
      <USelectMenu
        v-model="selectedRT"
        placeholder="Pilih RT"
        :search-input="{
          placeholder: 'Cari nama RT'
        }"
        :items="dropdownRT"
        value-key="key"
        label-key="lable"
        searchable
        class="w-40"
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

    <UTable
      ref="table"
      v-model:pagination="pagination"
      :data="dataFamilyCard"
      :columns="columnsFamilyTable"
      :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
    >
      <template #head-cell="{ row }">
        <div class="font-bold text-neutral-900">{{ row.original.head }}</div>
        <div v-if="row.original.address" class="text-xs text-neutral-400">
          Kav. {{ row.original.address.kavling }}
        </div>
      </template>

      <template #childs-cell="{ row }">
        <div class="flex flex-wrap gap-1">
          <UBadge
            v-for="child in row.original.childs"
            :key="child"
            variant="subtle"
            size="xs"
          >
            {{ child }}
          </UBadge>
        </div>
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

    <UModal v-model:open="isOpen" :ui="{ content: 'min-w-3xl' }">
      <template #header>
        <span class="font-bold"
          >{{ mode === 'add' ? 'Tambah' : 'Edit' }} Data Keluarga</span
        >
      </template>

      <template #body>
        <UForm
          :schema="FamilyCardFormSchema"
          :state="form"
          class="space-y-6 w-full"
          @submit="saveData"
        >
          <UFormField name="no_kk" label="No. Kartu Keluarga">
            <UInput v-model="form.no_kk" placeholder="No. Kartu Keluarga" />
          </UFormField>
          <div class="grid grid-cols-12 gap-3 w-full">
            <UFormField name="rt" label="Pilih RT" required class="col-span-2">
              <USelectMenu
                v-model.number="form.rt"
                placeholder="Pilih RT"
                :items="dropdownRT"
                value-key="key"
                label-key="lable"
                @change="getDropdownAddress(form.rt)"
              />
            </UFormField>

            <UFormField
              name="address_id"
              label="Pilih Alamat"
              required
              class="col-span-10"
            >
              <USelect
                v-model="form.address_id"
                :disabled="!form.rt"
                :items="dropdownAddress"
                value-key="key"
                label-key="lable"
                placeholder="Pilih Alamat"
              />
            </UFormField>
          </div>

          <UCard :ui="{ body: 'p-4' }" class="bg-neutral-50/50">
            <template #header
              ><span class="text-sm font-bold">Kepala Keluarga</span></template
            >
            <div class="grid grid-cols-12 gap-3">
              <UFormField
                name="head.name"
                label="Nama"
                class="col-span-5"
                required
              >
                <UInput v-model="form.head.name" />
              </UFormField>
              <UFormField
                name="head.phone"
                label="No. Telepon"
                class="col-span-4"
                required
              >
                <UInput v-model="form.head.phone" />
              </UFormField>
              <UFormField
                name="head.gender"
                label="Gender"
                class="col-span-3"
                required
              >
                <USelect
                  v-model="form.head.gender"
                  :items="genderItems"
                  value-key="key"
                />
              </UFormField>
            </div>
          </UCard>

          <UCard :ui="{ body: 'p-4' }" class="bg-neutral-50/50">
            <template #header
              ><span class="text-sm font-bold">Pasangan (Istri)</span></template
            >
            <div class="grid grid-cols-12 gap-3">
              <UFormField
                name="spouse.name"
                label="Nama"
                class="col-span-5"
                required
              >
                <UInput v-model="form.spouse.name" />
              </UFormField>
              <UFormField
                name="spouse.phone"
                label="No. Telepon"
                class="col-span-4"
                required
              >
                <UInput v-model="form.spouse.phone" />
              </UFormField>
              <UFormField
                name="spouse.gender"
                label="Gender"
                class="col-span-3"
                required
              >
                <USelect
                  v-model="form.spouse.gender"
                  :items="genderItems"
                  value-key="key"
                />
              </UFormField>
            </div>
          </UCard>

          <div class="space-y-3">
            <div class="flex justify-between items-center px-1">
              <span class="text-sm font-bold italic text-neutral-500"
                >Daftar Anak</span
              >
              <UButton
                label="Tambah Anak"
                icon="i-lucide-plus"
                size="xs"
                variant="outline"
                @click="form.childs.push({ name: '', phone: '', gender: 'L' })"
              />
            </div>

            <div
              v-for="(child, index) in form.childs"
              :key="index"
              class="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-white relative shadow-sm"
            >
              <UFormField label="Nama Anak" class="col-span-4">
                <UInput v-model="child.name" size="sm" />
              </UFormField>
              <UFormField label="No. HP" class="col-span-4">
                <UInput v-model="child.phone" size="sm" />
              </UFormField>
              <UFormField label="Gender" class="col-span-3">
                <USelect
                  v-model="child.gender"
                  :items="genderItems"
                  value-key="key"
                  size="sm"
                />
              </UFormField>
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                size="sm"
                class="col-span-1 mb-0.5"
                @click="form.childs.splice(index, 1)"
              />
            </div>
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
  </div>
</template>
