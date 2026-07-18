<script setup lang="ts">
import { z } from 'zod'
import { format } from 'date-fns'
import { fileUpload } from '~/services/files'

definePageMeta({ middleware: ['auth'] })

// Composables
const { dropdownRT, getDropdownRT } = useApiDropdown()

// Image state (page-specific)
const imageFile = ref<File | null>(null)

// Schema
const AnnouncementFormSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  for: z.array(z.string()).default([]),
  body: z.string().min(1, 'Isi pengumuman wajib diisi'),
  image: z.string().nullable().optional()
})

type AnnouncementForm = z.infer<typeof AnnouncementFormSchema>

// CRUD Composable
const {
  loading, data: announcements, pagination, isOpen, mode, form,
  perPageLimit, getData, openAddModal, openEditModal, saveData, confirmDelete
} = useCrudTable<AnnouncementForm>({
  endpoint: '/announcement',
  defaultForm: () => ({ title: '', for: [], body: '', image: '' }),
  displayField: 'title',
  extraParams: () => ({ rt: selectedRT.value }),
  transformPayload: async (data, _mode) => {
    let finalImageUrl = data.image
    if (imageFile.value) {
      const uploadRes = await fileUpload(imageFile.value)
      if (uploadRes) finalImageUrl = uploadRes
      else throw new Error('Gagal mengunggah gambar')
    }
    return { ...data, image: finalImageUrl }
  },
  transformRowToForm: (row) => ({
    title: row.title,
    for: Array.isArray(row.for) ? row.for : [],
    body: row.body,
    image: row.image
  }),
  confirmLabels: {
    deleteTitle: 'Hapus Pengumuman?',
    successDelete: 'Pengumuman berhasil dihapus'
  }
})

// Filter
const selectedRT = ref()
watch(selectedRT, () => {
  pagination.value.current_page = 1
  getData()
})

// Image helpers
const clearImage = () => {
  if (form.image?.startsWith('blob:')) URL.revokeObjectURL(form.image)
  form.image = ''
  imageFile.value = null
}

watch(imageFile, (newFile) => {
  if (newFile) {
    if (form.image?.startsWith('blob:')) URL.revokeObjectURL(form.image)
    form.image = URL.createObjectURL(newFile)
  }
})

// Columns
const columns = [
  { accessorKey: 'title', header: 'Judul' },
  { accessorKey: 'created_at', header: 'Tanggal Dibuat' },
  { accessorKey: 'image', header: 'Gambar' },
  { accessorKey: 'author.name', header: 'Penulis' },
  { accessorKey: 'action', header: 'Aksi' }
]

onMounted(() => {
  getDropdownRT()
  getData()
})
</script>

<template>
  <div class="space-y-4">
    <ConfirmDialog />

    <SharedHeaderBg>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary-50 rounded-lg">
          <UIcon name="i-lucide-megaphone" class="w-5 h-5 text-primary-600" />
        </div>
        <h2 class="text-lg font-bold text-gray-900">Manajemen Pengumuman</h2>
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
          class="rounded-full"
          @click="openAddModal"
        >
          Tambah Pengumuman
        </UButton>
      </div>
    </SharedHeaderBg>

    <UModal v-model:open="isOpen">
      <template #header>
        <span class="font-bold"
          >{{ mode === 'add' ? 'Tambah' : 'Edit' }} Pengumuman</span
        >
      </template>

      <template #body>
        <UForm
          :schema="AnnouncementFormSchema"
          :state="form"
          class="space-y-6"
          @submit="saveData"
        >
          <UFormField name="title" label="Judul" required>
            <UInput
              v-model="form.title"
              placeholder="Masukkan judul pengumuman"
            />
          </UFormField>

          <UFormField name="for" label="Ditujukan Pada">
            <USelect
              v-model="form.for"
              :items="dropdownRT"
              multiple
              value-key="key"
              label-key="label"
              placeholder="Pilih RT (Kosongkan untuk Semua)"
            />
          </UFormField>

          <UFormField name="image" label="Gambar Unggulan">
            <div class="w-full">
              <div
                v-if="form.image"
                class="group relative aspect-video w-full overflow-hidden rounded-lg border bg-gray-50"
              >
                <img :src="form.image" class="h-full w-full object-cover" >
                <div
                  class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <UButton
                    color="error"
                    variant="solid"
                    icon="i-lucide-trash-2"
                    label="Hapus Gambar"
                    @click="clearImage"
                  />
                </div>
              </div>
              <UFileUpload
                v-else
                v-model="imageFile"
                accept="image/*"
                :dropzone="true"
                class="aspect-video"
              />
            </div>
          </UFormField>

          <UFormField name="body" label="Isi Pengumuman" required>
            <UTextarea
              v-model="form.body"
              :rows="6"
              placeholder="Tulis isi pengumuman di sini..."
            />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="isOpen = false">Batal</UButton>
            <UButton type="submit" color="primary" :loading="loading"
              >Simpan</UButton
            >
          </div>
        </UForm>
      </template>
    </UModal>

    <div
      class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <UTable :data="announcements" :columns="columns" :loading="loading">
        <template #image-cell="{ row }">
          <div class="p-1">
            <img
              v-if="row.original.image"
              :src="row.original.image"
              class="aspect-video w-24 object-cover rounded shadow-sm"
            >
            <div
              v-else
              class="w-24 aspect-video bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-400"
            >
              No Image
            </div>
          </div>
        </template>

        <template #created_at-cell="{ row }">
          <span class="text-sm text-gray-600">
            {{
              row.original.created_at
                ? format(new Date(row.original.created_at), 'dd MMM yyyy')
                : '-'
            }}
          </span>
        </template>

        <template #action-cell="{ row }">
          <div class="flex gap-1">
            <UButton
              icon="i-lucide-pencil"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="openEditModal(row.original)"
            />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="sm"
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
          class="w-24"
        />
      </div>
      <UPagination
        v-model:page="pagination.current_page"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        @update:page="getData"
      />
    </div>
  </div>
</template>
