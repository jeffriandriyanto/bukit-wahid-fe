<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/vue-table'
import {
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
const tableFinancialStatements = useTemplateRef('table')
const selectedRT = ref('RT 01')
const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingIndex = ref<number | null>(null)
const rtItems = ['RT 01', 'RT 02', 'RT 03', 'RT 04']
const typeItems = ['Uang Masuk', 'Uang Keluar']

const dateObject = shallowRef(toCalendarDate(today(getLocalTimeZone())))

const FinancialStatementsFormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  for_rt: z.boolean().default(false),
  target_rt: z.string().optional(),
  nominal: z.coerce.number().min(1, 'Nominal wajib diisi'),
  date: z.union([z.date(), z.string().min(1, 'Tanggal wajib diisi')]),
  type: z.string().min(1, 'Pilih jenis laporan'),
  description: z.string().min(1, 'Deskripsi wajib diisi')
}).refine((data) => {
  if (data.for_rt && !data.target_rt) return false
  return true
}, {
  message: "RT tujuan wajib dipilih",
  path: ["target_rt"]
})

type FinancialStatementsFormSchema = z.infer<
  typeof FinancialStatementsFormSchema
>

const dataFinancialStatements = ref<FinancialStatements[]>([
  {
    name: 'Iuran Kas RW Januari',
    nominal: 5000000,
    date: '2026-01-01',
    type: 'Uang Masuk',
    for_rt: false,
    target_rt: '',
    description: 'Iuran kolektif dari seluruh RT (01-04)'
  },
  {
    name: 'Dana Sosial Kematian Warga',
    nominal: 1000000,
    date: '2026-01-02',
    type: 'Uang Keluar',
    for_rt: true,
    target_rt: 'RT 02',
    description: 'Santunan duka untuk keluarga Alm. Bapak Heru'
  },
  {
    name: 'Perbaikan Lampu Jalan Blok A',
    nominal: 450000,
    date: '2026-01-03',
    type: 'Uang Keluar',
    for_rt: true,
    target_rt: 'RT 01',
    description: 'Penggantian 3 titik lampu LED 20 Watt'
  },
  {
    name: 'Sumbangan Perayaan HUT RI',
    nominal: 7500000,
    date: '2026-01-04',
    type: 'Uang Masuk',
    for_rt: false,
    target_rt: '',
    description: 'Sponsorship dari PT. Maju Jaya untuk acara RW'
  },
  {
    name: 'Biaya Kebersihan Selokan',
    nominal: 300000,
    date: '2026-01-05',
    type: 'Uang Keluar',
    for_rt: true,
    target_rt: 'RT 04',
    description: 'Upah tenaga lepas untuk pembersihan sedimen'
  },
  {
    name: 'Kas Masuk Arisan Ibu-Ibu',
    nominal: 1200000,
    date: '2026-01-06',
    type: 'Uang Masuk',
    for_rt: true,
    target_rt: 'RT 03',
    description: 'Titipan kas arisan bulanan RT 03'
  },
  {
    name: 'Biaya Administrasi Bank',
    nominal: 15000,
    date: '2026-01-07',
    type: 'Uang Keluar',
    for_rt: false,
    target_rt: '',
    description: 'Potongan bulanan rekening bank RW'
  }
])

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val)
}

const columnsFinancialStatements = [
  {
    accessorKey: 'name',
    header: 'Laporan'
  },
  {
    accessorKey: 'nominal',
    header: 'Nominal'
  },
  {
    accessorKey: 'type',
    header: 'Jenis'
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
interface FinancialStatements {
  name: string
  nominal: number
  date: Date | string
  type: string
  description: string
  for_rt?: boolean
  target_rt?: string
  created_at?: string
}

const form = reactive<FinancialStatementsFormSchema>({
  name: '',
  for_rt: false,
  target_rt: '',
  nominal: 0,
  date: '',
  type: '',
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

const openEditModal = (row: FinancialStatements) => {
  const actualIndex = dataFinancialStatements.value.indexOf(row)
  if (actualIndex === -1) return

  mode.value = 'edit'
  editingIndex.value = actualIndex

  Object.assign(form, JSON.parse(JSON.stringify(row)))
  dateObject.value = toUIFormat(row.date)

  isOpen.value = true
}

const confirmDelete = async (row: FinancialStatementsFormSchema) => {
  const actualIndex = dataFinancialStatements.value.indexOf(row)
  if (actualIndex === -1) return

  const ok = await confirm({
    title: 'Hapus Data Keuangan?',
    description: `Apakah Anda yakin ingin menghapus data keuangan ini?`,
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  dataFinancialStatements.value.splice(actualIndex, 1)
}

watch(
  [dateObject],
  () => {
    if (dateObject.value) {
      form.date = dateObject.value.toDate(getLocalTimeZone())
    }
  },
  { immediate: true, deep: true }
)

const resetForm = () => {
  form.name = ''
  form.for_rt = false
  form.target_rt = ''
  form.nominal = 0
  form.date = ''
  form.type = ''
  form.description = ''

  const now = today(getLocalTimeZone())
  dateObject.value = toCalendarDate(now)

  form.date = dateObject.value.toDate(getLocalTimeZone())
}

const saveData = async (
  event: FormSubmitEvent<FinancialStatementsFormSchema>
) => {
  const validated = event.data

  const payload = {
    ...validated,
    date: dateObject.value.toDate(getLocalTimeZone())
  }

  if (mode.value === 'add') {
    dataFinancialStatements.value.unshift({
      ...payload,
      created_at: new Date().toISOString()
    } as any)
  } else if (mode.value === 'edit' && editingIndex.value !== null) {
    const old = dataFinancialStatements.value[editingIndex.value]
    dataFinancialStatements.value[editingIndex.value] = {
      ...old,
      ...payload
    } as any
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

      <div class="flex gap-4">
        <UButton
          color="error"
          variant="outline"
          trailing-icon="mdi-download"
        >
          Download
        </UButton>

        <UButton
          color="neutral"
          trailing-icon="mdi-plus-circle-outline"
          @click="openAddModal"
        >
          Tambah Laporan
        </UButton>
      </div>

      <UModal v-model:open="isOpen">
        <template #header>
          <span class="font-bold"
            >{{ mode === 'add' ? 'Tambah' : 'Edit' }} Agenda</span
          >
        </template>

        <template #body>
          <UForm
            v-if="isOpen"
            :schema="FinancialStatementsFormSchema"
            :state="form"
            class="w-full space-y-6"
            @submit="saveData"
          >
            <UFormField name="name" label="Nama Agenda" required>
              <UInput v-model="form.name" placeholder="Nama Agenda" />
            </UFormField>

            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <UCheckbox v-model="form.for_rt" label="Laporan khusus untuk RT tertentu?" />
              </div>

              <Transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
              >
                <UFormField v-if="form.for_rt" name="target_rt" label="Pilih RT Tujuan" required>
                  <USelect
                    v-model="form.target_rt"
                    :items="rtItems"
                    class="w-full"
                    placeholder="Pilih RT yang bersangkutan"
                    icon="i-lucide-users"
                  />
                </UFormField>
              </Transition>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <UFormField name="nominal" label="Nominal">
                <UInput
                  v-model="form.nominal"
                  type="number"
                  placeholder="Contoh: 100000"
                  icon="i-lucide-banknote"
                />
              </UFormField>

              <UFormField name="date" label="Tanggal">
                <UInputDate ref="inputDate" v-model="dateObject" hide-time-zone>
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
            </div>

            <UFormField name="type" label="Jenis">
              <USelect
                v-model="form.type"
                :items="typeItems"
                class="w-full"
                placeholder="Pilih Tipe"
              />
            </UFormField>

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
      <div class="flex items-center gap-4 mb-4 border border-secondary rounded-2xl bg-secondary-50 max-w-max p-4">
        <UIcon name="mdi:account-balance-wallet" class="size-8 text-secondary" />
        <div>
          <div class="text-xs">Saldo Akhir RW</div>
          <div class="font-bold text-2xl">Rp. 23.000.000</div>
        </div>
      </div>
      <UTable
        ref="table"
        v-model:pagination="pagination"
        :data="dataFinancialStatements"
        :columns="columnsFinancialStatements"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="flex-1"
      >
        <template #name-cell="{ row }">
          <div class="font-semibold">{{ row.original.name }}</div>
          <div class="text-[10px] mt-1">
            <UBadge
              :color="row.original.for_rt ? 'info' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ row.original.for_rt ? `Unit: ${row.original.target_rt}` : 'Unit: RW' }}
            </UBadge>
          </div>
        </template>
        <template #date-cell="{ row }">
          <div class="font-medium text-gray-900">
            {{
              row.original.date
                ? format(new Date(row.original.date), 'dd MMM yyyy')
                : '-'
            }}
          </div>
        </template>
        <template #nominal-cell="{ row }">
          <div
            :class="[
              'font-bold',
              row.original.type === 'Uang Masuk' ? 'text-info-600' : 'text-red-600'
            ]"
          >
            {{ row.original.type === 'Uang Masuk' ? '+' : '-' }}
            {{ formatCurrency(row.original.nominal) }}
          </div>
        </template>
        <template #type-cell="{ row }">
          <UBadge
            v-if="row.original.type === 'Uang Masuk'"
            color="success"
            variant="outline"
          >
            Uang Masuk
          </UBadge>
          <UBadge
            v-if="row.original.type === 'Uang Keluar'"
            color="error"
            variant="outline"
          >
            Uang Keluar
          </UBadge>
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
            (tableFinancialStatements?.tableApi?.getState().pagination
              .pageIndex || 0) + 1
          "
          :items-per-page="
            tableFinancialStatements?.tableApi?.getState().pagination.pageSize
          "
          :total="
            tableFinancialStatements?.tableApi?.getFilteredRowModel().rows
              .length
          "
          @update:page="
            (p) => tableFinancialStatements?.tableApi?.setPageIndex(p - 1)
          "
        />
      </div>
    </div>
  </div>
</template>
