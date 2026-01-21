<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/vue-table'
import { z } from 'zod'
import { format } from 'date-fns'

definePageMeta({
  middleware: ['auth']
})

const { reveal: confirm } = useConfirmService()
const tableCitizenComplaint = useTemplateRef('table')
const selectedRT = ref('RT 01')
const isOpen = ref(false)
const editingIndex = ref<number | null>(null)
const rtItems = ['RT 01', 'RT 02', 'RT 03', 'RT 04']

const CitizenComplaintFormSchema = z.object({
  response: z.string().min(1, 'Respon wajib diisi')
})

type CitizenComplaintFormSchema = z.infer<typeof CitizenComplaintFormSchema>

const dataCitizenComplaint = ref([
  {
    category: 'Sampah',
    description: 'Banyak Sampah disungai karna banjir semalam',
    response: '',
    image: 'https://picsum.photos/150',
    created_by: 'Anung',
    created_at: new Date().toISOString(),
    status: false
  },
  {
    category: 'Sampah',
    description: 'Banyak Sampah disungai karna banjir semalam',
    response: 'Sudah dibersihkan ya pak',
    image: 'https://picsum.photos/150',
    created_by: 'Anung',
    created_at: new Date().toISOString(),
    status: true
  }
])

const columnsCitizenComplaintTable = [
  {
    accessorKey: 'category',
    header: 'Kategori'
  },
  {
    accessorKey: 'description',
    header: 'Deskripsi',
    cell: (info: any) => {
      const desc = info.getValue() as string
      return desc.length > 50 ? desc.slice(0, 50) + '...' : desc
    }
  },
  {
    accessorKey: 'image',
    header: 'Gambar'
  },
  {
    accessorKey: 'created_by',
    header: 'Pelapor'
  },
  {
    accessorKey: 'status',
    header: 'Status'
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
interface CitizenComplaint {
  category: string
  description: string
  response: string
  image: string
  created_by: string
  created_at: string | Date
  status: boolean
}

const form = reactive<CitizenComplaint>({
  category: '',
  description: '',
  response: '',
  image: '',
  created_by: '',
  created_at: '',
  status: false
})

const openEditModal = (row: any) => {
  const actualIndex = dataCitizenComplaint.value.indexOf(row)
  if (actualIndex === -1) return

  editingIndex.value = actualIndex
  Object.assign(form, JSON.parse(JSON.stringify(row)))

  isOpen.value = true
}

const confirmDelete = async (row: any) => {
  const actualIndex = dataCitizenComplaint.value.indexOf(row)
  if (actualIndex === -1) return

  const ok = await confirm({
    title: 'Hapus Data Laporan?',
    description: `Apakah Anda yakin ingin menghapus laporan ini?`,
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  dataCitizenComplaint.value.splice(actualIndex, 1)
}

const resetForm = () => {
  Object.assign(form, {
    category: '',
    description: '',
    response: '',
    image: '',
    created_by: '',
    created_at: '',
    status: false
  })
}

const saveData = async (event: FormSubmitEvent<CitizenComplaintFormSchema>) => {
  const { response } = event.data

  if (editingIndex.value !== null) {
    const old = dataCitizenComplaint.value[editingIndex.value]
    dataCitizenComplaint.value[editingIndex.value] = {
      ...old,
      response,
    }
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
        color="error"
        variant="outline"
        trailing-icon="mdi-download"
      >
        Download
      </UButton>

      <UModal v-model:open="isOpen">
        <template #header>
          <span class="font-bold">Detail Laporan Warga</span>
        </template>

        <template #body>
          <div v-if="isOpen" class="space-y-4">
            <img
              :src="form.image"
              class="w-full aspect-video object-cover rounded-lg shadow-sm"
              placeholder="/placeholder-image.jpg"
            >

            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-sm">Kategori</div>
                <div class="font-bold">{{ form.category }}</div>
              </div>
              <div>
                <div class="text-sm">Pelapor</div>
                <div class="font-bold">{{ form.created_by }}</div>
              </div>
            </div>

            <div
              class="bg-neutral-50 p-3 rounded-md border-l-4 border-neutral-400"
            >
              <div class="text-xs text-neutral-500 uppercase font-semibold">
                Isi Laporan
              </div>
              <p class="text-sm mt-1">{{ form.description }}</p>
            </div>

            <div
              v-if="form.status"
              class="bg-green-50 p-3 rounded-md border-l-4 border-green-500"
            >
              <div class="text-xs text-green-600 uppercase font-semibold">
                Tanggapan Anda
              </div>
              <p class="text-sm mt-1">{{ form.response }}</p>
            </div>

            <UForm
              :schema="CitizenComplaintFormSchema"
              :state="form"
              class=""
              @submit="saveData"
            >
              <UFormField
                v-if="!form.status"
                name="response"
                label="Berikan Tanggapan Resmi"
              >
                <UTextarea
                  v-model="form.response"
                  :rows="4"
                  placeholder="Tulis tanggapan untuk warga di sini..."
                />
              </UFormField>

              <div class="flex justify-end gap-2 mt-4">
                <UButton variant="ghost" @click="isOpen = false">{{
                  form.status ? 'Tutup' : 'Batal'
                }}</UButton>
                <UButton v-if="!form.status" type="submit" color="primary"
                  >Kirim Tanggapan</UButton
                >
              </div>
            </UForm>
          </div>
        </template>
      </UModal>
    </div>

    <div>
      <UTable
        ref="table"
        v-model:pagination="pagination"
        :data="dataCitizenComplaint"
        :columns="columnsCitizenComplaintTable"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="flex-1"
      >
        <template #image-cell="{ row }">
          <img
            :src="row.original.image"
            alt="Announcement Image"
            class="aspect-video w-32 object-cover rounded-md"
          >
        </template>
        <template #created_by-cell="{ row }">
          <div>
            <div class="font-semibold font-lg">
              {{ row.original.created_by }}
            </div>
            <div>
              {{
                row.original.created_at
                  ? format(row.original.created_at, 'dd MMM yyyy')
                  : ''
              }}
            </div>
          </div>
        </template>
        <template #status-cell="{ row }">
          <UBadge v-if="row.original.status" color="success" variant="outline">
            Ditanggapi
          </UBadge>
          <UBadge v-if="!row.original.status" color="info" variant="outline">
            Tanggapi Sekarang
          </UBadge>
        </template>
        <template #action-cell="{ row }">
          <UButton
            icon="i-lucide-eye"
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
            (tableCitizenComplaint?.tableApi?.getState().pagination.pageIndex ||
              0) + 1
          "
          :items-per-page="
            tableCitizenComplaint?.tableApi?.getState().pagination.pageSize
          "
          :total="
            tableCitizenComplaint?.tableApi?.getFilteredRowModel().rows.length
          "
          @update:page="
            (p) => tableCitizenComplaint?.tableApi?.setPageIndex(p - 1)
          "
        />
      </div>
    </div>
  </div>
</template>
