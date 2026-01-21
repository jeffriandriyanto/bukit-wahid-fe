<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/vue-table'
import {
  Time,
  today,
  getLocalTimeZone,
  fromDate,
  toCalendarDate
} from '@internationalized/date'
import { z } from 'zod'
import { format } from 'date-fns'

definePageMeta({
  middleware: ['auth']
})

const inputDate = useTemplateRef('inputDate')
const { reveal: confirm } = useConfirmService()
const tableMeetingAgenda = useTemplateRef('table')
const selectedRT = ref('RT 01')
const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingIndex = ref<number | null>(null)
const rtItems = ['RT 01', 'RT 02', 'RT 03', 'RT 04']
const dateObject = shallowRef(toCalendarDate(today(getLocalTimeZone())))
const timeObject = shallowRef(new Time(0, 0))

const MeetingAgendaFormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  shown: z.string().min(1, 'Tujuan wajib dipilih'),
  date: z.union([z.date(), z.string().min(1, 'Tanggal wajib diisi')]),
  time: z.string().min(1, 'Jam wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi')
})

type MeetingAgendaFormSchema = z.infer<typeof MeetingAgendaFormSchema>

const dataMeetingAgenda = ref<MeetingAgenda[]>([
  {
    name: 'Pertemuan Warga RT 1',
    shown: 'RT 01',
    date: new Date,
    time: '19:00',
    description: 'Lokasi di Rumah Bapak Suyadi'
  }
])

const columnsFamilyTable = [
  {
    accessorKey: 'name',
    header: 'Nama Agenda'
  },
  {
    accessorKey: 'shown',
    header: 'Ditujukan'
  },
  {
    accessorKey: 'date',
    header: 'Tanggal'
  },
  {
    accessorKey: 'description',
    header: 'Catatan',
    cell: (info: any) => {
      const desc = info.getValue() as string
      return desc.length > 50 ? desc.slice(0, 50) + '...' : desc
    }
  },
  {
    accessorKey: 'action',
    header: 'Aksi'
  }
]

const pagination = ref({
  pageIndex: 0,
  pageSize: 5
})

/* =========================
  FORM STATE
========================= */
interface MeetingAgenda {
  name: string
  shown: string
  date: Date | string
  time: string
  description: string
  created_at?: string
}

const form = reactive<MeetingAgenda>({
  name: '',
  shown: '',
  date: '',
  time: '',
  description: ''
})

const openAddModal = () => {
  resetForm()
  mode.value = 'add'
  editingIndex.value = null
  isOpen.value = true
}

const toUIFormat = (dateInput: Date | string) => {
  const d = new Date(dateInput)
  const zonedDateTime = fromDate(d, getLocalTimeZone())
  return toCalendarDate(zonedDateTime)
}

const openEditModal = (row: MeetingAgenda) => {
  const actualIndex = dataMeetingAgenda.value.indexOf(row)
  if (actualIndex === -1) return

  mode.value = 'edit'
  editingIndex.value = actualIndex

  form.name = row.name
  form.shown = row.shown
  form.description = row.description
  dateObject.value = toUIFormat(row.date)

  try {
    const [h, m] = row.time.split(':').map(Number)
    timeObject.value = new Time(h, m)
  } catch {
    timeObject.value = new Time(0, 0)
  }

  isOpen.value = true
}

const confirmDelete = async (row: any) => {
  const actualIndex = dataMeetingAgenda.value.indexOf(row)
  if (actualIndex === -1) return

  const ok = await confirm({
    title: 'Hapus Data Agenda?',
    description: `Apakah Anda yakin ingin menghapus "${row.name}"?`,
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  dataMeetingAgenda.value.splice(actualIndex, 1)
}

watch([dateObject, timeObject], () => {
  if (dateObject.value) {
    form.date = dateObject.value.toDate(getLocalTimeZone())
  }
  if (timeObject.value) {
    form.time = timeObject.value.toString().slice(0, 5)
  }
}, { immediate: true, deep: true })


const resetForm = () => {
  form.name = ''
  form.shown = ''
  form.description = ''

  const now = today(getLocalTimeZone())
  dateObject.value = toCalendarDate(now)
  timeObject.value = new Time(0, 0)

  form.date = dateObject.value.toDate(getLocalTimeZone())
  form.time = '00:00'
}

const saveData = async (event: FormSubmitEvent<MeetingAgendaFormSchema>) => {
  const validated = event.data

  const payload = {
    ...validated,
    date: dateObject.value.toDate(getLocalTimeZone()),
    time: timeObject.value.toString().slice(0, 5)
  }

  if (mode.value === 'add') {
    dataMeetingAgenda.value.unshift({
      ...payload,
      created_at: new Date().toISOString()
    } as any)
  } else if (mode.value === 'edit' && editingIndex.value !== null) {
    const old = dataMeetingAgenda.value[editingIndex.value]
    dataMeetingAgenda.value[editingIndex.value] = { ...old, ...payload } as any
  }

  isOpen.value = false
  resetForm()
}
</script>

<template>
  <div>
    <ConfirmDialog />

    <div class="my-4 flex w-full justify-between gap-4">
      <USelect v-model="selectedRT" :items="rtItems" class="w-40" />

      <UButton
        color="neutral"
        trailing-icon="mdi-plus-circle-outline"
        @click="openAddModal"
      >
        Tambah Agenda
      </UButton>

      <UModal v-model:open="isOpen">
        <template #header>
          <span class="font-bold"
            >{{ mode === 'add' ? 'Tambah' : 'Edit' }} Agenda</span
          >
        </template>

        <template #body>
          <UForm
            v-if="isOpen"
            :schema="MeetingAgendaFormSchema"
            :state="form"
            class="w-full space-y-6"
            @submit="saveData"
          >
            <UFormField name="name" label="Nama Agenda" required>
              <UInput v-model="form.name" placeholder="Nama Agenda" />
            </UFormField>

            <UFormField name="shown" label="Ditujukan Pada">
              <USelect
                v-model="form.shown"
                :items="rtItems"
                class="w-full"
                searchable
                placeholder="Pilih RT"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField name="date" label="Tanggal">
                <UInputDate
                  ref="inputDate"
                  v-model="dateObject"
                  hide-time-zone
                >
                  <template #trailing>
                    <UPopover :reference="inputDate?.inputsRef[3]?.$el">
                      <UButton
                        color="neutral"
                        variant="link"
                        size="sm"
                        icon="i-lucide-calendar"
                        aria-label="Select a date"
                        class="px-0"
                      />

                      <template #content>
                        <UCalendar v-model="dateObject" />
                      </template>
                    </UPopover>
                  </template>
                </UInputDate>
              </UFormField>

              <UFormField name="time" label="Jam">
                <UInputTime
                  v-model="timeObject"
                  :hour-cycle="24"
                />
              </UFormField>
            </div>

            <UFormField name="description" label="Catatan">
              <UTextarea
                v-model="form.description"
                :rows="4"
                placeholder="Catatan"
              />
            </UFormField>

            <div class="flex w-full items-center justify-between gap-2">
              <UButton variant="ghost" @click="isOpen = false"> Batal </UButton>

              <UButton type="submit" color="neutral"> Simpan </UButton>
            </div>
          </UForm>
        </template>
      </UModal>
    </div>

    <div>
      <UTable
        ref="table"
        v-model:pagination="pagination"
        :data="dataMeetingAgenda"
        :columns="columnsFamilyTable"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="flex-1"
      >
        <template #date-cell="{ row }">
          <div class="font-medium text-gray-900">
            {{
              row.original.date
                ? format(new Date(row.original.date), 'dd MMM yyyy')
                : '-'
            }}
          </div>
          <div class="text-xs text-gray-500 italic">
            {{ row.original.time }} WIB
          </div>
        </template>
        <template #action-cell="{ row }">
          <UButton
            icon="i-lucide-pencil"
            variant="ghost"
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
          :page="
            (tableMeetingAgenda?.tableApi?.getState().pagination.pageIndex ||
              0) + 1
          "
          :items-per-page="
            tableMeetingAgenda?.tableApi?.getState().pagination.pageSize
          "
          :total="
            tableMeetingAgenda?.tableApi?.getFilteredRowModel().rows.length
          "
          @update:page="
            (p) => tableMeetingAgenda?.tableApi?.setPageIndex(p - 1)
          "
        />
      </div>
    </div>
  </div>
</template>
