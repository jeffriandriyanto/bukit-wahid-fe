<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { format } from 'date-fns'
import { fileUpload, fileDelete } from '~/services/files'
import { perPageLimit } from '~/const/utils'

const { reveal: confirm } = useConfirmService()
const toast = useToast()

/* =========================
  CONSTANTS & STATE
========================= */

const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingId = ref<string | null>(null)
const loading = ref(false)

// Penampung URL file yang akan dihapus dari server setelah sukses simpan
const imagesToDelete = ref<string[]>([])

/**
 * SCHEMA UPDATE:
 * Kita validasi apakah total (files lama + files baru) minimal 1.
 */
const GalleryFormSchema = z
  .object({
    name: z.string().min(1, { message: 'Judul kegiatan wajib diisi' }),
    date: z.string().min(1, { message: 'Tanggal kegiatan wajib diisi' }),
    description: z.string().optional(),
    files: z.array(z.string()), // URL dari server
    newFiles: z.array(z.any()) // File objek dari input
  })
  .refine((data) => data.files.length + data.newFiles.length > 0, {
    message: 'Minimal unggah 1 foto',
    path: ['files'] // Error akan muncul di bagian field "files"
  })

type GalleryFormSchema = z.infer<typeof GalleryFormSchema>

const dataGalleries = ref<any[]>([])

const columnsGalleryTable = [
  { accessorKey: 'name', header: 'Judul Kegiatan' },
  { accessorKey: 'description', header: 'Deskripsi' },
  { accessorKey: 'galeries_count', header: 'Jumlah Foto' },
  { accessorKey: 'action', header: 'Aksi' }
]

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

const form = reactive({
  name: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  description: '',
  files: [] as string[],
  newFiles: [] as File[] // Pindahkan imageFiles ke sini
})

/* =========================
  LOGIC HANDLERS
========================= */

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/galery', {
      params: {
        page: pagination.value.current_page,
        limit: pagination.value.per_page
      },
      method: 'GET'
    })
    if (res.status === 1) {
      dataGalleries.value = res.data
      if (res.pagination) pagination.value = { ...res.pagination }
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  resetForm()
  mode.value = 'add'
  isOpen.value = true
}

const openEditModal = async (row: any) => {
  loading.value = true
  try {
    const res = await useApi<any>(`/galery/${row.id}`, { method: 'GET' })
    if (res.status === 1) {
      resetForm()
      mode.value = 'edit'
      editingId.value = row.id

      const detail = res.data
      Object.assign(form, {
        name: detail.name,
        date: format(new Date(detail.created_at), 'yyyy-MM-dd'),
        description: detail.description,
        files: detail.files || [],
        newFiles: []
      })

      isOpen.value = true
    }
  } catch (err: any) {
    toast.add({
      title: err?.message || 'Gagal mengambil detail galeri',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const confirmDelete = async (row: any) => {
  const ok = await confirm({
    title: 'Hapus Galeri?',
    description: `Apakah Anda yakin ingin menghapus galeri "${row.name}"?`,
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  try {
    loading.value = true
    const res = await useApi<any>(`/galery/${row.id}`, { method: 'DELETE' })
    if (res.status === 1) {
      toast.add({ title: 'Galeri berhasil dihapus', color: 'success' })
      getData()
    }
  } catch (err: any) {
    toast.add({ title: err?.message || 'Gagal menghapus data', color: 'error' })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.name = ''
  form.date = format(new Date(), 'yyyy-MM-dd')
  form.description = ''
  form.files = []
  form.newFiles = []
  imagesToDelete.value = []
  editingId.value = null
}

const removeImage = (index: number) => {
  const removedUrl = form.files[index]
  if (mode.value === 'edit' && removedUrl.startsWith('http')) {
    imagesToDelete.value.push(removedUrl)
  }
  form.files.splice(index, 1)
}

const saveData = async (event: FormSubmitEvent<GalleryFormSchema>) => {
  loading.value = true
  try {
    // 1. Upload file baru
    let uploadedUrls: string[] = []
    if (form.newFiles.length > 0) {
      const uploadPromises = form.newFiles.map((file) => fileUpload(file))
      uploadedUrls = await Promise.all(uploadPromises)
    }

    // 2. Gabungkan data
    const finalFiles = [...form.files, ...uploadedUrls].filter((url) => !!url)

    const payload = {
      name: event.data.name,
      description: event.data.description,
      date: event.data.date,
      files: finalFiles
    }

    const url = mode.value === 'add' ? '/galery' : `/galery/${editingId.value}`
    const method = mode.value === 'add' ? 'POST' : 'PUT'

    const res = await useApi<any>(url, { method, body: payload })

    if (res.status === 1) {
      // 3. Cleanup file yang dihapus user
      if (imagesToDelete.value.length > 0) {
        await Promise.all(imagesToDelete.value.map((url) => fileDelete(url)))
      }

      toast.add({ title: 'Berhasil menyimpan galeri', color: 'success' })
      isOpen.value = false
      getData()
      resetForm()
    }
  } catch (err: any) {
    toast.add({ title: err?.message || 'Gagal menyimpan data', color: 'error' })
  } finally {
    loading.value = false
  }
}

watch(
  () => pagination.value.per_page,
  () => {
    pagination.value.current_page = 1
    getData()
  }
)

onMounted(() => getData())
definePageMeta({ middleware: ['auth'] })
</script>

<template>
  <div class="space-y-4">
    <ConfirmDialog />

    <SharedHeaderBg>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary-50 rounded-lg">
          <UIcon name="i-lucide-images" class="w-5 h-5 text-primary-600" />
        </div>
        <h2 class="text-lg font-bold text-gray-900">
          Galeri & Dokumentasi Kegiatan
        </h2>
      </div>
      <UButton
        color="neutral"
        trailing-icon="mdi-plus-circle-outline"
        @click="openAddModal"
      >
        Tambah Galeri
      </UButton>
    </SharedHeaderBg>

    <UModal v-model:open="isOpen" :ui="{ width: 'sm:max-w-2xl' }">
      <template #header>
        <span class="font-bold"
          >{{ mode === 'add' ? 'Tambah' : 'Edit' }} Galeri Kegiatan</span
        >
      </template>

      <template #body>
        <UForm
          :schema="GalleryFormSchema"
          :state="form"
          class="space-y-6"
          @submit="saveData"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField name="name" label="Judul Kegiatan" required>
              <UInput
                v-model="form.name"
                placeholder="Contoh: Kerja Bakti Blok A"
              />
            </UFormField>

            <UFormField name="date" label="Tanggal Kegiatan" required>
              <UInput v-model="form.date" type="date" />
            </UFormField>
          </div>

          <UFormField name="description" label="Deskripsi (Opsional)">
            <UTextarea
              v-model="form.description"
              :rows="3"
              placeholder="Ceritakan singkat..."
            />
          </UFormField>

          <UFormField name="files" label="Foto Kegiatan" required>
            <div class="space-y-4">
              <div v-if="form.files.length > 0" class="grid grid-cols-3 gap-2">
                <div
                  v-for="(img, idx) in form.files"
                  :key="idx"
                  class="relative group aspect-square"
                >
                  <NuxtImg
                    :src="img"
                    class="h-full w-full object-cover rounded-lg border"
                  />
                  <div
                    class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg"
                  >
                    <UButton
                      color="error"
                      variant="solid"
                      size="xs"
                      icon="i-lucide-trash"
                      @click="removeImage(idx)"
                    />
                  </div>
                </div>
              </div>

              <UFileUpload
                v-model="form.newFiles"
                accept="image/*"
                multiple
                :dropzone="true"
                class="w-full"
                icon="i-lucide-image-plus"
                label="Klik untuk menambah foto baru"
              />
            </div>
          </UFormField>

          <div class="flex justify-end gap-2 pt-4">
            <UButton variant="ghost" @click="isOpen = false">Batal</UButton>
            <UButton type="submit" color="neutral" :loading="loading"
              >Simpan Galeri</UButton
            >
          </div>
        </UForm>
      </template>
    </UModal>

    <div
      class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <UTable
        :data="dataGalleries"
        :columns="columnsGalleryTable"
        :loading="loading"
      >
        <template #description-cell="{ row }">
          <span class="text-sm text-gray-500 line-clamp-1">{{
            row.original.description
          }}</span>
        </template>
        <template #galeries_count-cell="{ row }">
          <UBadge color="primary" variant="subtle"
            >{{ row.original.galeries_count }} Foto</UBadge
          >
        </template>
        <template #action-cell="{ row }">
          <div class="flex items-center gap-1">
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

    <div class="flex justify-between items-center px-2">
      <div class="flex items-center gap-2 text-sm text-gray-500">
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
