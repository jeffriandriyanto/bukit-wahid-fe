<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/vue-table'
import { z } from 'zod'
import { format } from 'date-fns'

definePageMeta({
  middleware: ['auth']
})

const { reveal: confirm } = useConfirmService()
const tableAnnouncementCard = useTemplateRef('table')
const selectedRT = ref('RT 01')
const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingIndex = ref<number | null>(null)
const rtItems = ['RT 01', 'RT 02', 'RT 03', 'RT 04']
const fileUpload = ref<File[]>([])

const AnnouncementFormSchema = z.object({
  title: z.string().min(1, 'Nama wajib diisi'),
  shown: z.string(),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  image: z.string().optional()
})

type AnnouncementFormSchema = z.infer<typeof AnnouncementFormSchema>

const dataAnnouncementCard = ref([
  {
    title: 'Pertemuan Warga Bulanan',
    shown: 'RT 01',
    description: 'Pertemuan warga bulanan akan diadakan pada tanggal 1 Januari 2025 di Balai RW.',
    image: 'https://picsum.photos/150',
    created_at: new Date().toISOString()
  },
  {
    title: 'Pemberitahuan Pemeliharaan Jalan',
    shown: 'Semua RT',
    description: 'Pemeliharaan jalan akan dilakukan pada tanggal 5 Januari 2025. Harap berhati-hati saat melintas di area tersebut.',
    image: 'https://picsum.photos/152',
    created_at: new Date().toISOString()
  },
  {
    title: 'Acara Gotong Royong',
    shown: 'RT 03',
    description: 'Acara gotong royong akan diadakan pada tanggal 10 Januari 2025. Mari bersama-sama membersihkan lingkungan kita.',
    image: 'https://picsum.photos/151',
    created_at: new Date().toISOString()
  }
])

const columnsFamilyTable = [
  {
    accessorKey: 'title',
    header: 'Judul'
  },
  {
    accessorKey: 'shown',
    header: 'Ditujukan Pada'
  },
  {
    accessorKey: 'created_at',
    header: 'Tanggal Dibuat'
  },
  {
    accessorKey: 'image',
    header: 'Gambar'
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
interface FamilyCard {
  title: string
  shown?: string
  description: string
  image?: string
}

const form = reactive<FamilyCard>({
  title: '',
  shown: undefined,
  description: '',
  image: ''
})

const openAddModal = () => {
  resetForm()
  mode.value = 'add'
  editingIndex.value = null
  isOpen.value = true
}

const openEditModal = (row: any) => {
  const actualIndex = dataAnnouncementCard.value.indexOf(row)
  if (actualIndex === -1) return

  mode.value = 'edit'
  editingIndex.value = actualIndex

  form.title = row.title
  form.shown = row.shown
  form.description = row.description
  form.image = row.image
  isOpen.value = true
}

const confirmDelete = async (row: any) => {
  const actualIndex = dataAnnouncementCard.value.indexOf(row)
  if (actualIndex === -1) return

  const ok = await confirm({
    title: 'Hapus Data Pengumuman?',
    description: `Apakah Anda yakin ingin menghapus "${row.title}"?`,
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  dataAnnouncementCard.value.splice(actualIndex, 1)
}

watch(fileUpload, (newFiles) => {
  if (newFiles && newFiles.length > 0) {
    if (form.image?.startsWith('blob:')) {
      URL.revokeObjectURL(form.image)
    }
    const file = newFiles[0]
    form.image = URL.createObjectURL(file)
  }
})

const resetForm = () => {
  form.title = ''
  form.shown = undefined
  form.description = ''
  clearImage()
}

const clearImage = () => {
  if (form.image?.startsWith('blob:')) {
    URL.revokeObjectURL(form.image)
  }
  form.image = ''
  fileUpload.value = []
}

const saveData = async (event: FormSubmitEvent<AnnouncementFormSchema>) => {
  const validated = event.data

  if (mode.value === 'add') {
    dataAnnouncementCard.value.unshift({ // Gunakan unshift agar data baru di atas
      ...validated,
      image: form.image,
      created_at: new Date().toISOString()
    } as any)
  } else if (mode.value === 'edit' && editingIndex.value !== null) {
    const old = dataAnnouncementCard.value[editingIndex.value]
    dataAnnouncementCard.value[editingIndex.value] = {
      ...old,
      ...validated,
      image: form.image
    }
  }

  isOpen.value = false
  resetForm()
  fileUpload.value = []
}
</script>

<template>
  <div>
    <ConfirmDialog />

    <div class="my-4 flex w-full justify-between gap-4">
      <USelect
        v-model="selectedRT"
        :items="rtItems"
        class="w-40"
      />

      <UButton
        color="neutral"
        trailing-icon="mdi-plus-circle-outline"
        @click="openAddModal"
      >
        Tambah Agenda
      </UButton>

      <UModal
        v-model:open="isOpen"
      >
        <template #header>
          <span class="font-bold">{{ mode === 'add' ? 'Tambah' : 'Edit' }} Pengumuman dan Berita</span>
        </template>

        <template #body>
          <UForm
            :schema="AnnouncementFormSchema"
            :state="form"
            class="w-full space-y-6"
            @submit="saveData"
          >
            <UFormField
              name="title"
              label="Judul Pengumuman"
              required
            >
              <UInput
                v-model="form.title"
                placeholder="Judul Pengumuman"
              />
            </UFormField>

            <UFormField
              name="shown"
              label="Ditujukan Pada"
            >
              <USelect
                v-model="form.shown"
                :items="rtItems"
                class="w-full"
                searchable
                placeholder="Pilih RT"
              />
            </UFormField>

            <UFormField name="image">
              <div class="w-full">
                <div v-if="form.image" class="group relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  <img
                    :src="form.image"
                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  >
                  <div class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <UButton
                      color="error"
                      variant="solid"
                      icon="i-lucide-trash-2"
                      label="Hapus & Ganti Gambar"
                      @click="clearImage"
                    />
                  </div>
                </div>

                <UFileUpload
                  v-else
                  v-model="fileUpload"
                  accept="image/*"
                  :dropzone="true"
                  class="aspect-video"
                  icon="uil:image-upload"
                  :ui="{
                    base: 'bg-neutral-100'
                  }"
                />
              </div>
            </UFormField>

            <UFormField
              name="description"
              label="Catatan"
            >
              <UTextarea
                v-model="form.description"
                :rows="4"
                placeholder="Catatan"
              />
            </UFormField>

            <div class="flex w-full items-center justify-between gap-2">
              <UButton
                variant="ghost"
                @click="isOpen = false"
              >
                Batal
              </UButton>

              <UButton
                type="submit"
                color="neutral"
              >
                Simpan
              </UButton>
            </div>
          </UForm>
        </template>
      </UModal>
    </div>

    <div>
      <UTable
        ref="table"
        v-model:pagination="pagination"
        :data="dataAnnouncementCard"
        :columns="columnsFamilyTable"
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
        <template #created_at-cell="{ row }">
          <span>{{ row.original.created_at ? format(row.original.created_at, 'dd MMM yyyy') : '' }}</span>
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
            (tableAnnouncementCard?.tableApi?.getState().pagination.pageIndex || 0)
              + 1
          "
          :items-per-page="
            tableAnnouncementCard?.tableApi?.getState().pagination.pageSize
          "
          :total="tableAnnouncementCard?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p) => tableAnnouncementCard?.tableApi?.setPageIndex(p - 1)"
        />
      </div>
    </div>
  </div>
</template>
