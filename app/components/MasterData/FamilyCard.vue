<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { genderItems } from '~/const/dropdown'

const { dropdownRT, dropdownAddress, getDropdownRT, getDropdownAddress } =
  useApiDropdown()

// ===== 1. SCHEMAS =====
const personSchema = {
  phone: z.string(),
  gender: z.enum(['L', 'P']),
  blood_type: z.string(),
  dob: z.any(),
  pob: z.string()
}

const FamilyCardFormSchema = z.object({
  no_kk: z.string().min(1, 'No. Kartu keluarga wajib diisi'),
  rt: z.string().min(1, 'RT wajib diisi'),
  address_id: z.string().min(1, 'Alamat wajib diisi'),
  head: z.object({
    name: z.string().min(1, 'Nama wajib diisi'),
    ...personSchema
  }),
  spouse: z.object({
    name: z.string(),
    ...personSchema
  }),
  childs: z.array(
    z.object({
      name: z.string().min(1, 'Nama Anak wajib diisi'),
      ...personSchema
    })
  )
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
const selectedRT = ref()
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

// const todayDate = shallowRef(toCalendarDate(today(getLocalTimeZone())))

const form = reactive<FamilyCardFormSchema>({
  no_kk: '',
  rt: '',
  address_id: '',
  head: {
    name: '',
    phone: '',
    gender: 'L',
    blood_type: '',
    pob: '',
    dob: null
  },
  spouse: {
    name: '',
    phone: '',
    gender: 'P',
    blood_type: '',
    pob: '',
    dob: null
  },
  childs: []
})

// ===== 3. ACTIONS =====
const resetForm = () => {
  editingId.value = null
  Object.assign(form, {
    no_kk: '',
    rt: '',
    address_id: '',
    head: {
      name: '',
      phone: '',
      gender: 'L',
      blood_type: '',
      pob: '',
      dob: null
    },
    spouse: {
      name: '',
      phone: '',
      gender: 'P',
      blood_type: '',
      pob: '',
      dob: null
    },
    childs: []
  })
}

const getData = async () => {
  loading.value = true;
  try {
    const res = await useApi<any>('/familly/get', {
      params: {
        rt: selectedRT.value,
        page: pagination.value.current_page,
        per_page: pagination.value.per_page
      },
      method: 'GET'
    })

    if (res.status === 1) {
      dataFamilyCard.value = res.data
      pagination.value = {
        ...res.pagination
      }
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false;
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
    const res = await useApi<any>(`/familly/show/${row.id}`)

    if (res.status === 1) {
      const { no_kk, rt, address, head, spouse, childs } = res.data

      form.no_kk = no_kk
      form.rt = rt
      await getDropdownAddress(rt)
      form.address_id = address

      form.head = {
        ...head,
        dob: parseToCalendarDate(head.dob)
      }

      form.spouse = {
        ...spouse,
        dob: parseToCalendarDate(spouse.dob)
      }

      form.childs = childs.map((c: any) => ({
        ...c,
        dob: parseToCalendarDate(c.dob)
      }))
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
  } catch (err: any) {
    toast.add({ title: err?.message || 'Gagal menghapus data', color: 'error' })
  } finally {
    loading.value = false
  }
}

const addressHandler = () => {
  form.address_id = ''
  getDropdownAddress(form.rt)
}

const saveData = async (event: FormSubmitEvent<FamilyCardFormSchema>) => {
  const payload = {
    no_kk: event.data.no_kk || null,
    address: event.data.address_id,
    head: {
      ...event.data.head,
      dob: formatDOB(event.data.head.dob)
    },
    spouse: {
      ...event.data.spouse,
      dob: formatDOB(event.data.spouse.dob)
    },
    childs: event.data.childs.map((c: any) => ({
      ...c,
      dob: formatDOB(c.dob)
    }))
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
        label-key="label"
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
      :data="dataFamilyCard"
      :columns="columnsFamilyTable"
      :loading="loading"
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
          <UFormField
            v-if="mode === 'add'"
            name="no_kk"
            label="No. Kartu Keluarga"
          >
            <UInput v-model="form.no_kk" placeholder="No. Kartu Keluarga" />
          </UFormField>
          <div class="grid grid-cols-12 gap-3 w-full">
            <UFormField name="rt" label="Pilih RT" required class="col-span-2">
              <USelect
                v-model="form.rt"
                :items="dropdownRT"
                placeholder="Pilih RT"
                value-key="key"
                label-key="label"
                @change="addressHandler"
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
                label-key="label"
                placeholder="Pilih Alamat"
              />
            </UFormField>
          </div>

          <UCard :ui="{ body: 'p-4 space-y-3' }" class="bg-neutral-50/50">
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
                <UInput v-model="form.head.name" placeholder="Nama" />
              </UFormField>
              <UFormField
                name="head.phone"
                label="No. Telepon"
                class="col-span-4"
              >
                <UInput v-model="form.head.phone" placeholder="No. Telepon" />
              </UFormField>
              <UFormField
                name="head.gender"
                label="Jenis Kelamin"
                class="col-span-3"
              >
                <USelect
                  v-model="form.head.gender"
                  :items="genderItems"
                  value-key="key"
                />
              </UFormField>
            </div>
            <div class="grid grid-cols-12 gap-3">
              <UFormField
                name="head.pob"
                label="Tempat Lahir"
                class="col-span-5"
              >
                <UInput v-model="form.head.pob" placeholder="Tempat Lahir" />
              </UFormField>
              <UFormField
                name="head.dob"
                label="Tanggal Lahir"
                class="col-span-4"
              >
                <UInputDate v-model="form.head.dob" />
              </UFormField>
              <UFormField
                name="head.blood_type"
                label="Golongan Darah"
                class="col-span-3"
              >
                <UInput
                  v-model="form.head.blood_type"
                  placeholder="Golongan Darah"
                />
              </UFormField>
            </div>
          </UCard>

          <UCard :ui="{ body: 'p-4 space-y-3' }" class="bg-neutral-50/50">
            <template #header
              ><span class="text-sm font-bold">Pasangan / Istri</span></template
            >
            <div class="grid grid-cols-12 gap-3">
              <UFormField name="spouse.name" label="Nama" class="col-span-5">
                <UInput v-model="form.spouse.name" placeholder="Nama" />
              </UFormField>
              <UFormField
                name="spouse.phone"
                label="No. Telepon"
                class="col-span-4"
              >
                <UInput v-model="form.spouse.phone" placeholder="No. Telepon" />
              </UFormField>
              <UFormField
                name="spouse.gender"
                label="Jenis Kelamin"
                class="col-span-3"
              >
                <USelect
                  v-model="form.spouse.gender"
                  :items="genderItems"
                  value-key="key"
                />
              </UFormField>
            </div>
            <div class="grid grid-cols-12 gap-3">
              <UFormField
                name="spouse.pob"
                label="Tempat Lahir"
                class="col-span-5"
              >
                <UInput v-model="form.spouse.pob" placeholder="Tempat Lahir" />
              </UFormField>
              <UFormField
                name="spouse.dob"
                label="Tanggal Lahir"
                class="col-span-4"
              >
                <UInputDate v-model="form.spouse.dob" />
              </UFormField>
              <UFormField
                name="spouse.blood_type"
                label="Golongan Darah"
                class="col-span-3"
              >
                <UInput
                  v-model="form.spouse.blood_type"
                  placeholder="Golongan Darah"
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
                @click="
                  form.childs.push({
                    name: '',
                    phone: '',
                    gender: 'L',
                    blood_type: '',
                    pob: '',
                    dob: null
                  })
                "
              />
            </div>

            <div
              v-for="(child, index) in form.childs"
              :key="index"
              class="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-white relative shadow-sm"
            >
              <UFormField label="Nama Anak" class="col-span-4">
                <UInput
                  v-model="child.name"
                  :placeholder="`Nama Anak ke ${index + 1}`"
                />
              </UFormField>
              <UFormField label="No. Telepon" class="col-span-4">
                <UInput v-model="child.phone" placeholder="No. Telepon" />
              </UFormField>
              <UFormField label="Jenis Kelamin" class="col-span-4">
                <USelect
                  v-model="child.gender"
                  :items="genderItems"
                  value-key="key"
                  placeholder="Jenis Kelamin"
                />
              </UFormField>
              <UFormField label="Tempat Lahir" class="col-span-4">
                <UInput v-model="child.pob" placeholder="Tempat Lahir" />
              </UFormField>
              <UFormField label="Tanggal Lahir" class="col-span-4">
                <UInputDate v-model="child.dob" />
              </UFormField>
              <UFormField label="Golongan Darah" class="col-span-3">
                <UInput
                  v-model="child.blood_type"
                  placeholder="Golongan Darah"
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
