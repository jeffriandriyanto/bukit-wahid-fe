<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { perPageLimit } from '~/const/utils'

// Composables & Services
const { dropdownRT, getDropdownRT } = useApiDropdown()
const { reveal: confirm } = useConfirmService()
const toast = useToast()

/* =========================
  TAB & TABLE STATE
========================= */
const tabs = [
  {
    label: 'Agenda Berjalan',
    value: '',
    icon: 'i-lucide-calendar-play'
  },
  { label: 'Agenda Selesai', value: 'done', icon: 'i-lucide-calendar-check' }
]
const activeTab = ref('') // Default ke Agenda Berjalan

const selectedRT = ref()
const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingId = ref<string | null>(null)
const loading = ref(false)

const columnsAgendaTable = [
  { accessorKey: 'title', header: 'Agenda' },
  { accessorKey: 'start_date', header: 'Waktu Pelaksanaan' },
  { accessorKey: 'location', header: 'Lokasi' },
  { accessorKey: 'action', header: 'Aksi' }
]

const dataAgendaCard = ref([])
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

/* =========================
  FORM STATE & SCHEMA
========================= */
const AgendaFormSchema = z.object({
  title: z.string().min(1, 'Judul agenda wajib diisi'),
  fors: z.array(z.string()).default([]),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  location: z.string().optional(),
  start_date: z.any().refine((val) => !!val, 'Tanggal mulai wajib diisi'),
  start_time: z.any().refine((val) => !!val, 'Jam mulai wajib diisi'),
  end_date: z.any().optional(),
  end_time: z.any().optional()
})

type AgendaFormSchema = z.infer<typeof AgendaFormSchema>

const form = reactive({
  title: '',
  fors: [],
  description: '',
  location: '',
  start_date: null,
  start_time: null,
  end_date: null,
  end_time: null
})

/* =========================
  METHODS
========================= */
const getData = async () => {
  loading.value = true
  try {
    const endpoint = activeTab.value === 'done' ? '/agenda?done=true' : '/agenda'

    const res = await useApi<any>(endpoint, {
      params: {
        rt: selectedRT.value,
        page: pagination.value.current_page,
        limit: pagination.value.per_page
      },
      method: 'GET'
    })

    if (res.status === 1) {
      dataAgendaCard.value = res.data
      pagination.value = { ...res.pagination }
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

const isUrl = (str: string) => {
  if (!str) return false
  const pattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
  return pattern.test(str)
}

const openAddModal = () => {
  resetForm()
  mode.value = 'add'
  isOpen.value = true
}

const openEditModal = async (row: any) => {
  resetForm()
  mode.value = 'edit'
  editingId.value = row.id

  Object.assign(form, {
    ...row,
    start_date: parseToCalendarDate(row.start_date),
    start_time: parseToTime(row.start_time),
    end_date: row.end_date ? parseToCalendarDate(row.end_date) : null,
    end_time: row.end_time ? parseToTime(row.end_time) : null,
    fors: Array.isArray(row.fors) ? row.fors.map((f: any) => f.id || f) : []
  })
  isOpen.value = true
}

const confirmDelete = async (row: any) => {
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
      getData()
    }
  } catch (err: any) {
    toast.add({ title: err?.message || 'Gagal menghapus data', color: 'error' })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(form, {
    title: '',
    fors: [],
    description: '',
    location: '',
    start_date: null,
    start_time: null,
    end_date: null,
    end_time: null
  })
}

const saveData = async (event: FormSubmitEvent<AgendaFormSchema>) => {
  try {
    loading.value = true
    const payload = {
      ...event.data,
      start_date: formatDOB(event.data.start_date),
      start_time: formatTimeValue(event.data.start_time),
      end_date: event.data.end_date ? formatDOB(event.data.end_date) : null,
      end_time: event.data.end_time
        ? formatTimeValue(event.data.end_time)
        : null,
      fors: event.data.fors || []
    }

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

/* =========================
  WATCHERS
========================= */
// Watcher untuk tab, RT, dan per_page (semuanya reset ke hal 1)
watch([activeTab, selectedRT, () => pagination.value.per_page], () => {
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
  <div class="space-y-6">
    <ConfirmDialog />

    <SharedHeaderBg>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary-50 rounded-lg">
          <UIcon
            name="i-lucide-calendar-days"
            class="w-5 h-5 text-primary-600"
          />
        </div>
        <h2 class="text-lg font-bold text-gray-900">Manajemen Agenda</h2>
      </div>

      <div class="flex items-center gap-3">
        <USelectMenu
          v-model="selectedRT"
          placeholder="Filter RT"
          :items="dropdownRT"
          value-key="key"
          label-key="label"
          class="w-44"
        />
        <UButton
          color="primary"
          icon="i-lucide-plus-circle"
          class="rounded-full px-6"
          @click="openAddModal"
        >
          Tambah Agenda
        </UButton>
      </div>
    </SharedHeaderBg>

    <div class="border-b border-gray-100">
      <UTabs
        v-model="activeTab"
        :items="tabs"
        class="w-full"
        :ui="{ root: 'flex items-center gap-4' }"
      />
    </div>

    <div
      class="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm"
    >
      <UTable
        :data="dataAgendaCard"
        :columns="columnsAgendaTable"
        :loading="loading"
      >
        <template #start_date-cell="{ row }">
          <div class="flex flex-col">
            <span class="font-bold text-gray-900">{{
              formatDate(row.original.start_date)
            }}</span>
            <span class="text-xs text-gray-500"
              >{{ row.original.start_time }} WIB</span
            >
          </div>
        </template>

        <template #location-cell="{ row }">
          <div class="max-w-64">
            <template v-if="isUrl(row.original.location)">
              <a
                :href="
                  row.original.location.startsWith('http')
                    ? row.original.location
                    : `https://${row.original.location}`
                "
                target="_blank"
                class="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                <UIcon name="i-lucide-video" class="w-3.5 h-3.5" />
                Buka Link Meeting
              </a>
            </template>
            <template v-else>
              <div class="flex items-center gap-2 text-gray-600 text-sm italic">
                <UIcon name="i-lucide-map-pin" class="w-3.5 h-3.5 opacity-50" />
                {{ row.original.location || '-' }}
              </div>
            </template>
          </div>
        </template>

        <template #action-cell="{ row }">
          <div class="flex gap-1">
            <UButton
              v-if="activeTab === 0"
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
          </div>
        </template>
      </UTable>
    </div>

    <div class="flex justify-between items-center">
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
        :max="7"
        @update:page="getData"
      />
    </div>

    <UModal v-model:open="isOpen" :ui="{ width: 'sm:max-w-xl' }">
      <template #header>
        <div class="flex flex-col">
          <span class="text-lg font-bold"
            >{{ mode === 'add' ? 'Buat' : 'Perbarui' }} Agenda</span
          >
          <span
            class="text-xs text-gray-500 font-medium uppercase tracking-wider"
            >Lengkapi rincian kegiatan warga</span
          >
        </div>
      </template>

      <template #body>
        <UForm
          :schema="AgendaFormSchema"
          :state="form"
          class="space-y-6 py-2"
          @submit="saveData"
        >
          <UFormField name="title" label="Judul Agenda" required>
            <UInput
              v-model="form.title"
              placeholder="Contoh: Kerja Bakti Bulanan"
              size="lg"
            />
          </UFormField>

          <UFormField
            name="fors"
            label="Ditujukan Untuk"
            help="Pilih RT atau biarkan kosong untuk seluruh warga"
          >
            <USelect
              v-model="form.fors"
              :items="dropdownRT"
              multiple
              value-key="key"
              label-key="label"
              placeholder="Pilih RT"
              size="lg"
            />
          </UFormField>

          <div
            class="grid grid-cols-2 gap-x-4 gap-y-6 p-4 bg-gray-50 rounded-2xl border border-gray-100"
          >
            <UFormField name="start_date" label="Tanggal Mulai" required>
              <UInputDate v-model="form.start_date" />
            </UFormField>
            <UFormField name="start_time" label="Jam Mulai" required>
              <UInputTime v-model="form.start_time" :hour-cycle="24" />
            </UFormField>
            <UFormField name="end_date" label="Tanggal Selesai (Opsional)">
              <UInputDate v-model="form.end_date" />
            </UFormField>
            <UFormField name="end_time" label="Jam Selesai (Opsional)">
              <UInputTime v-model="form.end_time" :hour-cycle="24" />
            </UFormField>
          </div>

          <UFormField name="location" label="Lokasi / Tautan">
            <UInput
              v-model="form.location"
              placeholder="Alamat fisik atau Link Zoom/Meet"
              size="lg"
            >
              <template #leading>
                <UIcon
                  :name="
                    isUrl(form.location) ? 'i-lucide-link' : 'i-lucide-map-pin'
                  "
                />
              </template>
            </UInput>
          </UFormField>

          <UFormField name="description" label="Detail Kegiatan" required>
            <UTextarea
              v-model="form.description"
              :rows="4"
              placeholder="Tuliskan detail agenda di sini..."
            />
          </UFormField>

          <div class="flex justify-end gap-3 pt-4">
            <UButton variant="ghost" color="neutral" @click="isOpen = false"
              >Batal</UButton
            >
            <UButton
              type="submit"
              color="primary"
              :loading="loading"
              class="px-8 rounded-full"
            >
              Simpan Agenda
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
