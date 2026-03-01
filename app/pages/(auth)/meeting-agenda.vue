<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

const { dropdownRT, getDropdownRT } = useApiDropdown()

const { reveal: confirm } = useConfirmService()
const toast = useToast()

const selectedRT = ref()
const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingId = ref<string | null>(null)
const loading = ref(false)

const AgendaFormSchema = z.object({
  title: z.string().min(1, 'Nama wajib diisi'),
  fors: z.array(z.string()).default([]),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  location: z.string().optional(),
  start_date: z.any(),
  start_time: z.any()
})

type AgendaFormSchema = z.infer<typeof AgendaFormSchema>

const dataAgendaCard = ref([])

const columnsAgendaTable = [
  {
    accessorKey: 'title',
    header: 'Judul'
  },
  {
    accessorKey: 'start_date',
    header: 'Tanggal Agenda'
  },
  {
    accessorKey: 'start_time',
    header: 'Jam Agenda'
  },
  {
    accessorKey: 'location',
    header: 'Lokasi'
  },
  {
    accessorKey: 'description',
    header: 'Deskripsi'
  },
  {
    accessorKey: 'action',
    header: 'Aksi'
  }
]

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

/* =========================
  FORM STATE
========================= */
interface AgendaType {
  title: string
  fors?: []
  description: string
  location: string
  start_date: any
  start_time: any
}

const form = reactive<AgendaType>({
  title: '',
  fors: [],
  description: '',
  location: '',
  start_date: null,
  start_time: null
})

const isUrl = (str: string) => {
  if (!str) return false
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ) // fragment locator
  return !!pattern.test(str)
}

const openAddModal = () => {
  resetForm()
  mode.value = 'add'
  isOpen.value = true
}

const openEditModal = async (row: any) => {
  const actualIndex = dataAgendaCard.value.indexOf(row)
  resetForm()
  mode.value = 'edit'
  editingId.value = row.id
  if (actualIndex === -1) return

  Object.assign(form, {
    ...row,
    start_date: parseToCalendarDate(row.start_date),
    start_time: parseToTime(row.start_time)
  })
  isOpen.value = true
}

const confirmDelete = async (row: any) => {
  const actualIndex = dataAgendaCard.value.indexOf(row)
  if (actualIndex === -1) return

  const ok = await confirm({
    title: 'Hapus Data Agenda?',
    description: `Apakah Anda yakin ingin menghapus "${row.title}"?`,
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  try {
    loading.value = true
    const res = await useApi<any>(`/agenda/${row.id}`, { method: 'DELETE' })
    if (res.status === 1) {
      toast.add({ title: 'Data berhasil dihapus', color: 'success' })
      dataAgendaCard.value.splice(actualIndex, 1)
    }
  } catch (err: any) {
    toast.add({ title: err?.message || 'Gagal menghapus data', color: 'error' })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.title = ''
  form.fors = []
  form.description = ''
  form.location = ''
  form.start_date = null
  form.start_time = null
}

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/agenda', {
      params: {
        rt: selectedRT.value,
        page: pagination.value.current_page,
        per_page: pagination.value.per_page
      },
      method: 'GET'
    })

    if (res.status === 1) {
      dataAgendaCard.value = res.data
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

const saveData = async (event: FormSubmitEvent<AgendaFormSchema>) => {
  try {
    loading.value = true

    const payload = {
      ...event.data,
      start_date: formatDOB(event.data.start_date),
      start_time: formatTimeValue(event.data.start_time),
      fors: event.data.fors || []
    }

    console.log('payload', payload)

    const url = mode.value === 'add' ? '/agenda' : `/agenda/${editingId.value}`
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
      resetForm()
    }
  } catch (err: any) {
    toast.add({
      title: err?.message || 'Terjadi kesalahan server',
      color: 'error'
    })
  } finally {
    loading.value = false
  }

  isOpen.value = false
  resetForm()
}

watch(selectedRT, () => {
  pagination.value.current_page = 1
  getData()
})

onMounted(() => {
  getDropdownRT()
  getData()
})

definePageMeta({
  middleware: ['auth']
})
</script>

<template>
  <div>
    <ConfirmDialog />

    <div
      class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4"
    >
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
      >
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
        />

        <UButton
          color="neutral"
          trailing-icon="mdi-plus-circle-outline"
          @click="openAddModal"
        >
          Tambah Agenda
        </UButton>
      </div>
    </div>

    <UModal v-model:open="isOpen">
      <template #header>
        <span class="font-bold"
          >{{ mode === 'add' ? 'Tambah' : 'Ubah' }} Agenda</span
        >
      </template>

      <template #body>
        <UForm
          :schema="AgendaFormSchema"
          :state="form"
          class="w-full space-y-6"
          @submit="saveData"
        >
          <UFormField name="title" label="Nama Agenda" required>
            <UInput v-model="form.title" placeholder="Nama Agenda" />
          </UFormField>

          <UFormField name="for" label="Ditujukan Pada">
            <USelect
              v-model="form.fors"
              :items="dropdownRT"
              multiple
              value-key="key"
              value-label="label"
              class="w-full"
              searchable
              placeholder="Pilih RT"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField name="start_date" label="Tanggal">
              <UInputDate v-model="form.start_date" />
            </UFormField>

            <UFormField name="time" label="Jam">
              <UInputTime v-model="form.start_time" :hour-cycle="24" />
            </UFormField>
          </div>

          <UFormField name="location" label="Lokasi">
            <UInput v-model="form.location" placeholder="Lokasi" />
          </UFormField>

          <UFormField name="description" label="Catatan">
            <UTextarea
              v-model="form.description"
              :rows="4"
              placeholder="Deskripsi"
            />
          </UFormField>

          <div class="flex w-full items-center justify-between gap-2">
            <UButton variant="ghost" @click="isOpen = false"> Batal </UButton>

            <UButton type="submit" color="neutral" :loading="loading">
              Simpan
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <div>
      <UTable
        ref="table"
        :data="dataAgendaCard"
        :columns="columnsAgendaTable"
        class="flex-1"
      >
        <template #start_date-cell="{ row }">
          {{ formatDate(row.original.start_date) }}
        </template>

        <template #location-cell="{ row }">
          <div class="max-w-50 truncate">
            <template v-if="isUrl(row.original.location)">
              <a
                :href="
                  row.original.location.startsWith('http')
                    ? row.original.location
                    : `https://${row.original.location}`
                "
                target="_blank"
                class="text-primary-500 hover:underline flex items-center gap-1 font-medium"
              >
                <UIcon name="i-lucide-external-link" class="w-4 h-4" />
                Buka Tautan
              </a>
            </template>

            <template v-else>
              <span class="text-gray-600">
                {{ row.original.location || '-' }}
              </span>
            </template>
          </div>
        </template>

        <template #action-cell="{ row }">
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
            @click="confirmDelete(row.original)"
          />
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
    </div>
  </div>
</template>
