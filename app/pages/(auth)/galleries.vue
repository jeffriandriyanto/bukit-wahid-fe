<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { format } from 'date-fns'
import { fileUpload } from '~/services/files'
import { perPageLimit, categories } from '~/const/utils'
const { reveal: confirm } = useConfirmService()
const toast = useToast()

/* =========================
  CONSTANTS & STATE
========================= */

const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingId = ref<string | null>(null)
const loading = ref(false)

// Ref untuk menampung banyak file sekaligus
const imageFiles = ref<File[]>([])

// Schema Zod 4
const GalleryFormSchema = z.object({
  title: z.string().min(1, { error: 'Judul kegiatan wajib diisi' }),
  event_date: z.string().min(1, { error: 'Tanggal kegiatan wajib diisi' }),
  category: z.string().min(1, { error: 'Kategori wajib dipilih' }),
  description: z.string().optional(),
  images: z.array(z.string()).min(1, { error: 'Minimal unggah 1 foto' })
})

type GalleryFormSchema = z.infer<typeof GalleryFormSchema>

const dataGalleries = ref([])

const columnsGalleryTable = [
  { accessorKey: 'title', header: 'Judul Kegiatan' },
  { accessorKey: 'category', header: 'Kategori' },
  { accessorKey: 'event_date', header: 'Tanggal Kegiatan' },
  { accessorKey: 'images', header: 'Preview' },
  { accessorKey: 'action', header: 'Aksi' }
]

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

const form = reactive({
  title: '',
  event_date: format(new Date(), 'yyyy-MM-dd'),
  category: '',
  description: '',
  images: [] as string[]
})

/* =========================
  LOGIC HANDLERS
========================= */

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/galleries', {
      params: {
        page: pagination.value.current_page,
        limit: pagination.value.per_page
      },
      method: 'GET'
    })
    if (res.status === 1) {
      dataGalleries.value = res.data
      pagination.value = { ...res.pagination }
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
  resetForm()
  mode.value = 'edit'
  editingId.value = row.id
  Object.assign(form, {
    ...row,
    // Pastikan tanggal dalam format YYYY-MM-DD untuk input date
    event_date: format(new Date(row.event_date), 'yyyy-MM-dd')
  })
  isOpen.value = true
}

const confirmDelete = async (row: any) => {
  const ok = await confirm({
    title: 'Hapus Galeri?',
    description: `Apakah Anda yakin ingin menghapus galeri "${row.title}"?`,
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  try {
    loading.value = true
    const res = await useApi<any>(`/galleries/${row.id}`, { method: 'DELETE' })
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
    event_date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    description: '',
    images: []
  })
  imageFiles.value = []
}

const removeImage = (index: number) => {
  form.images.splice(index, 1)
}

const saveData = async (event: FormSubmitEvent<GalleryFormSchema>) => {
  try {
    loading.value = true

    let uploadedUrls: string[] = []
    if (imageFiles.value.length > 0) {
      const uploadPromises = Array.from(imageFiles.value).map((file) =>
        fileUpload(file)
      )
      uploadedUrls = await Promise.all(uploadPromises)
    }

    // 2. Gabungkan foto lama (saat edit) dengan foto baru yang diupload
    const finalImages = [...form.images, ...uploadedUrls].filter((url) => !!url)

    const payload = {
      ...event.data,
      images: finalImages
    }

    const url =
      mode.value === 'add' ? '/galleries' : `/galleries/edit/${editingId.value}`
    const method = mode.value === 'add' ? 'POST' : 'PUT'

    const res = await useApi<any>(url, { method, body: payload })

    if (res.status === 1) {
      toast.add({
        title: `Berhasil ${mode.value === 'add' ? 'menambah' : 'mengubah'} galeri`,
        color: 'success'
      })
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
            <UFormField name="title" label="Judul Kegiatan" required>
              <UInput
                v-model="form.title"
                placeholder="Contoh: Kerja Bakti Blok A"
              />
            </UFormField>

            <UFormField name="event_date" label="Tanggal Kegiatan" required>
              <UInput v-model="form.event_date" type="date" />
            </UFormField>
          </div>

          <UFormField name="category" label="Kategori" required>
            <USelect
              v-model="form.category"
              :items="categories"
              placeholder="Pilih Kategori"
              class="w-full"
            />
          </UFormField>

          <UFormField name="description" label="Deskripsi (Opsional)">
            <UTextarea
              v-model="form.description"
              :rows="3"
              placeholder="Ceritakan singkat kegiatan ini..."
            />
          </UFormField>

          <UFormField name="images" label="Foto Kegiatan (Bisa lebih dari 1)">
            <div class="space-y-4">
              <div v-if="form.images.length > 0" class="grid grid-cols-3 gap-2">
                <div
                  v-for="(img, idx) in form.images"
                  :key="idx"
                  class="relative group aspect-square"
                >
                  <img
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
                v-model="imageFiles"
                accept="image/*"
                multiple
                :dropzone="true"
                class="w-full"
                icon="i-lucide-image-plus"
                label="Klik atau seret beberapa foto ke sini"
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
      <UTable :data="dataGalleries" :columns="columnsGalleryTable">
        <template #category-cell="{ row }">
          <UBadge variant="subtle" color="neutral" class="capitalize">
            {{ row.original.category }}
          </UBadge>
        </template>

        <template #event_date-cell="{ row }">
          <span class="text-sm">{{
            format(new Date(row.original.event_date), 'dd MMM yyyy')
          }}</span>
        </template>

        <template #images-cell="{ row }">
          <div class="flex -space-x-3 overflow-hidden">
            <img
              v-for="(img, idx) in row.original.images.slice(0, 3)"
              :key="idx"
              :src="img"
              class="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
            />
            <div
              v-if="row.original.images.length > 3"
              class="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 ring-2 ring-white text-[10px] font-medium text-gray-500"
            >
              +{{ row.original.images.length - 3 }}
            </div>
          </div>
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
          value-attribute="value"
          option-attribute="label"
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
