<script setup lang="ts">
import type { FormSubmitEvent, TabsItem } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/vue-table'
import { z } from 'zod'
import { format } from 'date-fns'

definePageMeta({
  middleware: ['auth']
})

/* =========================
  STATE & CONSTANTS
========================= */
const { reveal: confirm } = useConfirmService()
const tablePanicButton = useTemplateRef('table')
const selectedRT = ref('RT 01')
const isOpen = ref(false)
const editingId = ref<number | null>(null) // Pakai ID lebih aman daripada Index
const rtItems = ['RT 01', 'RT 02', 'RT 03', 'RT 04']

// Dummy Data
const dataPanicButton = ref([
  {
    id: 1,
    created_by: 'Ahmad Subarjo',
    location: 'Blok A/12',
    created_at: new Date().toISOString(),
    status: 'Pending',
    reason: ''
  },
  {
    id: 2,
    created_by: 'Siti Aminah',
    location: 'Blok C/05',
    created_at: new Date().toISOString(),
    status: 'Resolved',
    reason: 'Salah tekan oleh anak'
  },
  {
    id: 3,
    created_by: 'Budi Santoso',
    location: 'Blok B/21',
    created_at: new Date().toISOString(),
    status: 'Canceled',
    reason: 'Masalah selesai mandiri'
  },
  {
    id: 4,
    created_by: 'Herman Tato',
    location: 'Blok E/01',
    created_at: new Date().toISOString(),
    status: 'Pending',
    reason: ''
  }
])

const PanicButtonFormSchema = z.object({
  reason: z.string().min(5, 'Alasan minimal 5 karakter')
})

type PanicButtonFormSchema = z.infer<typeof PanicButtonFormSchema>

const columnsPanicButtonTable = [
  { accessorKey: 'created_by', header: 'Pelapor' },
  { accessorKey: 'location', header: 'Lokasi/Unit' },
  { accessorKey: 'created_at', header: 'Waktu Kejadian' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'action', header: 'Aksi' }
]

const pagination = ref({
  pageIndex: 0,
  pageSize: 5
})

const form = reactive({
  reason: ''
})

// Tab State
const selectedTab = ref('0')
const tabs = [
  { label: 'Sedang Berjalan', slot: 'active' },
  { label: 'Selesai', slot: 'completed' }
] satisfies TabsItem[]

/* =========================
  LOGIC: FILTER DATA
========================= */
const filteredData = computed(() => {
  if (selectedTab.value === '0') {
    return dataPanicButton.value.filter((item) => item.status === 'Pending')
  } else {
    return dataPanicButton.value.filter((item) => item.status !== 'Pending')
  }
})

/* =========================
  METHODS
========================= */
const formatDateTime = (dateStr: string) => {
  return format(new Date(dateStr), 'dd MMM yyyy, HH:mm')
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'warning'
    case 'resolved':
      return 'success'
    case 'canceled':
      return 'error'
    default:
      return 'neutral'
  }
}

const openEditModal = (row: any) => {
  editingId.value = row.id
  form.reason = row.reason || ''
  isOpen.value = true
}

const saveData = async (event: FormSubmitEvent<PanicButtonFormSchema>) => {
  const index = dataPanicButton.value.findIndex(
    (item) => item.id === editingId.value
  )

  if (index !== -1) {
    // Masukan: Ketika admin mengisi alasan, status otomatis dianggap 'Resolved' (Selesai)
    // Jika ingin opsi 'Canceled', Anda bisa menambah dropdown di dalam modal.
    dataPanicButton.value[index] = {
      ...dataPanicButton.value[index],
      reason: event.data.reason,
      status: 'Resolved'
    }
  }

  isOpen.value = false
  editingId.value = null
  form.reason = ''
}

const confirmDelete = async (row: any) => {
  const ok = await confirm({
    title: 'Hapus Laporan?',
    description: `Apakah Anda yakin ingin menghapus data dari ${row.created_by}?`,
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (ok) {
    dataPanicButton.value = dataPanicButton.value.filter(
      (item) => item.id !== row.id
    )
  }
}
</script>

<template>
  <div>
    <ConfirmDialog />

    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4"
    >
      <USelect v-model="selectedRT" :items="rtItems" class="w-32" />
    </div>

    <UModal v-model:open="isOpen">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-clipboard-check" class="text-primary" />
          <span class="font-bold">Konfirmasi Penyelesaian Laporan</span>
        </div>
      </template>

      <template #body>
        <UForm
          :schema="PanicButtonFormSchema"
          :state="form"
          class="space-y-4"
          @submit="saveData"
        >
          <UFormField
            name="reason"
            label="Catatan Penanganan"
            help="Tuliskan tindakan yang telah diambil untuk laporan ini"
          >
            <UTextarea
              v-model="form.reason"
              :rows="4"
              placeholder="Contoh: Bantuan sudah dikirim ke lokasi, situasi aman."
              autofocus
            />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton variant="ghost" color="neutral" @click="isOpen = false"
              >Batal</UButton
            >
            <UButton type="submit" color="primary">Selesaikan Laporan</UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <UTabs
      v-model="selectedTab"
      :items="tabs"
      variant="link"
      class="mb-6 w-full"
      :ui="{
        label:
          'text-md font-semibold group-data-[state=inactive]:text-gray-500',
        indicator: 'h-1 bg-primary-600',
        list: 'px-0 border-b border-gray-200'
      }"
    />

    <div class="rounded-lg border border-gray-200 overflow-hidden bg-white">
      <UTable
        ref="table"
        v-model:pagination="pagination"
        :data="filteredData"
        :columns="columnsPanicButtonTable"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
      >
        <template #created_at-cell="{ row }">
          <span class="text-sm text-gray-600">
            {{ formatDateTime(row.original.created_at) }}
          </span>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="getStatusColor(row.original.status)"
            variant="solid"
            size="sm"
          >
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #action-cell="{ row }">
          <div class="flex items-center gap-1">
            <UTooltip
              :text="
                row.original.status === 'Pending'
                  ? 'Proses Laporan'
                  : 'Lihat Detail'
              "
            >
              <UButton
                :icon="
                  row.original.status === 'Pending'
                    ? 'i-lucide-check-circle'
                    : 'i-lucide-eye'
                "
                variant="ghost"
                :color="
                  row.original.status === 'Pending' ? 'primary' : 'neutral'
                "
                @click="openEditModal(row.original)"
              />
            </UTooltip>
            <UTooltip text="Hapus Log">
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                color="error"
                @click="confirmDelete(row.original)"
              />
            </UTooltip>
          </div>
        </template>
      </UTable>

      <div
        class="flex justify-between items-center p-4 border-t border-gray-100"
      >
        <span class="text-xs text-gray-400 italic">
          Menampilkan {{ filteredData.length }} data laporan
        </span>
        <UPagination
          :page="
            (tablePanicButton?.tableApi?.getState().pagination.pageIndex || 0) +
            1
          "
          :items-per-page="
            tablePanicButton?.tableApi?.getState().pagination.pageSize
          "
          :total="tablePanicButton?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p) => tablePanicButton?.tableApi?.setPageIndex(p - 1)"
        />
      </div>
    </div>
  </div>
</template>
