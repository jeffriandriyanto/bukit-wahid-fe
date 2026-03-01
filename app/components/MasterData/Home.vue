<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const {
  dropdownRT,
  dropdownFamilyHead,
  dropdownResidenceType,
  getDropdownRT,
  getDropdownFamilyHead,
  getDropdownResidenceType
} = useApiDropdown()

// ===== 1. SCHEMAS =====

const HomeFormSchema = z.object({
  pic: z.string().min(1, 'Penanggung Jawab wajib diisi'),
  rt: z.string().min(1, 'RT wajib diisi'),
  type: z.string().min(1, 'Tipe Kavling wajib diisi'),
  kavling: z.string().min(1, 'Kavling wajib diisi'),
  land_size: z.number(),
  building_size: z.number()
})

type HomeFormSchema = z.infer<typeof HomeFormSchema>

// ===== 2. STATE =====
const { reveal: confirm } = useConfirmService()
const toast = useToast()

const isOpen = ref(false)
const editingId = ref<string | null>(null)
const loading = ref(false)
const loadingEdit = ref(false)

const dataHome = ref<any[]>([])
const selectedRT = ref()

const selectedKavling = ref()
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

const form = reactive<HomeFormSchema>({
  pic: '',
  rt: '',
  type: '',
  kavling: '',
  land_size: 0,
  building_size: 0
})

// ===== 3. ACTIONS =====
const resetForm = () => {
  editingId.value = null
  Object.assign(form, {
    pic: '',
    rt: '',
    type: '',
    kavling: '',
    land_size: 0,
    building_size: 0
  })
}

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/residence', {
      params: {
        rt: selectedRT.value,
        type: selectedKavling.value,
        page: pagination.value.current_page,
        per_page: pagination.value.per_page
      },
      method: 'GET'
    })

    if (res.status === 1) {
      dataHome.value = res.data
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

const openEditModal = async (row: any) => {
  loadingEdit.value = true
  resetForm()
  editingId.value = row.id

  try {
    const rt = row.rt

    if (rt) {
      Object.assign(form, { ...row })
      await getDropdownFamilyHead()
      await getDropdownResidenceType(rt)
      const res = await useApi<any>(`/residence/${row.id}`)

      if (res.status === 1) {
        console.log(res.data)
      }
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
    title: 'Hapus Data Rumah?',
    description: 'Data yang dihapus tidak dapat dikembalikan.',
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  try {
    loading.value = true
    const res = await useApi<any>(`/residence/${id}`, { method: 'DELETE' })
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

const saveData = async (event: FormSubmitEvent<HomeFormSchema>) => {
  try {
    loading.value = true
    const res = await useApi<any>(`/residence/${editingId.value}`, {
      method: 'PUT',
      body: { ...event.data }
    })

    if (res.status === 1) {
      toast.add({
        title: `Berhasil mengubah data`,
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

watch(selectedRT, () => {
  pagination.value.current_page = 1
  getData()
})

onMounted(() => {
  getDropdownRT()
  getData()
})

const columnsFamilyTable = [
  { accessorKey: 'head', header: 'Penanggung Jawab' },
  { accessorKey: 'type', header: 'Tipe' },
  { accessorKey: 'kavling', header: 'Kavling' },
  { accessorKey: 'land_size', header: 'Luas Tanah' },
  { accessorKey: 'building_size', header: 'Luas Rumah' },
  { id: 'action', header: 'Aksi' }
]
</script>

<template>
  <div class="space-y-4">
    <ConfirmDialog />

    <div class="flex gap-4 items-center mt-4">
      <USelectMenu
        v-model="selectedRT"
        placeholder="Pilih RT"
        :search-input="{
          placeholder: 'Cari RT RT'
        }"
        :items="dropdownRT"
        value-key="key"
        label-key="label"
        searchable
        class="w-40"
        @change="getDropdownResidenceType(selectedRT)"
      />

      <USelectMenu
        v-model="selectedKavling"
        placeholder="Pilih tipe kavling"
        :disabled="!selectedRT"
        :search-input="{
          placeholder: 'Cari tipe kavling'
        }"
        :items="dropdownResidenceType"
        value-key="key"
        label-key="label"
        searchable
        class="w-40"
        @change="getData"
      />
    </div>

    <UTable
      ref="table"
      :data="dataHome"
      :columns="columnsFamilyTable"
      :loading="loading"
    >
      <template #head-cell="{ row }">
        {{ row.original.pic_profile?.name || 'PIC Belum diisi' }}
      </template>

      <template #land_size-cell="{ row }">
        {{ row.original.land_size }} m2
      </template>

      <template #building_size-cell="{ row }">
        {{ row.original.building_size }} m2
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
        <span class="font-bold">Edit Data Rumah</span>
      </template>

      <template #body>
        <UForm
          :schema="HomeFormSchema"
          :state="form"
          class="space-y-6 w-full"
          @submit="saveData"
        >
          <div class="grid grid-cols-12 gap-3 w-full">
            <UFormField
              name="rt_detail.name"
              label="Pilih RT"
              required
              class="col-span-2"
            >
              <UInput
                :value="form.rt_detail.name"
                readonly
                placeholder="Pilih RT"
              />
            </UFormField>

            <UFormField
              name="pic"
              label="Pilih Penanggung Jawab"
              required
              class="col-span-10"
            >
              <USelect
                v-model="form.pic"
                :disabled="!form.rt"
                :items="dropdownFamilyHead"
                value-key="key"
                label-key="label"
                placeholder="Pilih Penanggung Jawab"
              />
            </UFormField>

            <UFormField name="type" label="Pilih Tipe" class="col-span-3">
              <USelect
                v-model="form.type"
                disabled
                :items="dropdownResidenceType"
                value-key="key"
                label-key="label"
                placeholder="Type"
              />
            </UFormField>

            <UFormField
              name="kavling"
              label="Pilih Kavling"
              required
              class="col-span-3"
            >
              <UInput v-model="form.kavling" placeholder="Kavling" readonly />
            </UFormField>

            <UFormField
              name="land_size"
              label="Luas Tanah"
              class="col-span-3"
              required
            >
              <UInput
                v-model.number="form.land_size"
                placeholder="Luas Tanah"
              />
            </UFormField>

            <UFormField
              name="building_size"
              label="Luas Bangunan"
              class="col-span-3"
              required
            >
              <UInput
                v-model.number="form.building_size"
                placeholder="Luas Bangunan"
              />
            </UFormField>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t">
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
