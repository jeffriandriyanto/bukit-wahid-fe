<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { format } from 'date-fns'
import { fileUpload } from '~/services/files'

const { dropdownRT, getDropdownRT } = useApiDropdown()

const { reveal: confirm } = useConfirmService()
const toast = useToast()

const selectedRT = ref()
const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingId = ref<string | null>(null)
const imageFile = ref(null)
const loading = ref(false)

const AnnouncementFormSchema = z.object({
  title: z.string().min(1, 'Nama wajib diisi'),
  for: z.array(z.string()).default([]),
  body: z.string().min(1, 'Konten wajib diisi'),
  author_id: z.string().optional(),
  published_at: z.string().nullable().optional(),
  image: z.string().nullable().optional()
})

type AnnouncementFormSchema = z.infer<typeof AnnouncementFormSchema>

const dataAnnouncementCard = ref([])

const columnsNewsTable = [
  {
    accessorKey: 'title',
    header: 'Judul'
  },
  {
    accessorKey: 'for',
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
    accessorKey: 'author.name',
    header: 'Penulis'
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
interface FamilyCard {
  title: string
  for?: []
  body: string
  image?: string
}

const form = reactive<FamilyCard>({
  title: '',
  for: [],
  body: '',
  image: ''
})

const openAddModal = () => {
  resetForm()
  mode.value = 'add'
  isOpen.value = true
}

const openEditModal = async (row: any) => {
  const actualIndex = dataAnnouncementCard.value.indexOf(row)
  resetForm()
  mode.value = 'edit'
  editingId.value = row.id
  if (actualIndex === -1) return

  Object.assign(form, { ...row })
  isOpen.value = true
}

const confirmDelete = async (row: any) => {
  const actualIndex = dataAnnouncementCard.value.indexOf(row)
  if (actualIndex === -1) return

  const ok = await confirm({
    title: 'Hapus Data Berita?',
    description: `Apakah Anda yakin ingin menghapus "${row.title}"?`,
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  try {
    loading.value = true
    const res = await useApi<any>(`/news/${row.id}`, { method: 'DELETE' })
    if (res.status === 1) {
      toast.add({ title: 'Data berhasil dihapus', color: 'success' })
      dataAnnouncementCard.value.splice(actualIndex, 1)
    }
  } catch (err: any) {
    toast.add({ title: err?.message || 'Gagal menghapus data', color: 'error' })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.title = ''
  form.for = []
  form.body = ''
  clearImage()
}

const clearImage = () => {
  if (form.image?.startsWith('blob:')) {
    URL.revokeObjectURL(form.image)
  }
  form.image = ''
  imageFile.value = null
}

const publishHandler = async (row: any) => {
  const ok = await confirm({
    title: 'Tayangkan Berita?',
    description:
      'Berita ini akan muncul dan bisa dilihat oleh warga yang dituju',
    confirmLabel: 'Tayangkan',
    cancelLabel: 'Batal',
    color: 'primary'
  })

  if (!ok) return

  try {
    loading.value = true
    const res = await useApi<any>(`/news/publish/${row.id}`, {
      method: 'PUT'
    })

    if (res.status === 1) {
      toast.add({
        title: 'Berhasil publish Berita',
        color: 'success'
      })
      getData()
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

const unpublishHandler = async (row: any) => {
  const ok = await confirm({
    title: 'Sembunyikan Berita?',
    description:
      'Berita akan ditarik dari publik dan disimpan sebagai draf',
    confirmLabel: 'Sembunyikan',
    cancelLabel: 'Batal',
    color: 'neutral'
  })

  if (!ok) return

  try {
    loading.value = true
    const res = await useApi<any>(`/news/unpublish/${row.id}`, {
      method: 'PUT'
    })

    if (res.status === 1) {
      toast.add({
        title: 'Berita berhasil disembunyikan',
        color: 'success'
      })
      getData()
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/news', {
      params: {
        rt: selectedRT.value,
        page: pagination.value.current_page,
        per_page: pagination.value.per_page
      },
      method: 'GET'
    })

    if (res.status === 1) {
      dataAnnouncementCard.value = res.data
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

const saveData = async (event: FormSubmitEvent<AnnouncementFormSchema>) => {
  try {
    loading.value = true

    let finalImageUrl = form.image
    if (imageFile.value) {
      const uploadRes = await fileUpload(imageFile.value)
      if (uploadRes) finalImageUrl = uploadRes
      else {
        throw new Error('Gagal mengunggah gambar ke server')
      }
    }

    const payload = {
      ...event.data,
      image: finalImageUrl,
      for: event.data.for || []
    }

    const url = mode.value === 'add' ? '/news' : `/news/edit/${editingId.value}`
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

watch(imageFile, (newFiles) => {
  if (newFiles) {
    if (form.image?.startsWith('blob:')) {
      URL.revokeObjectURL(form.image)
    }
    form.image = URL.createObjectURL(newFiles)
  }
})

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

    <div class="my-4 flex w-full justify-end gap-4">
      <!-- <USelectMenu
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
      /> -->

      <UButton
        color="neutral"
        trailing-icon="mdi-plus-circle-outline"
        @click="openAddModal"
      >
        Tambah Berita
      </UButton>

      <UModal v-model:open="isOpen">
        <template #header>
          <span class="font-bold"
            >{{ mode === 'add' ? 'Tambah' : 'Edit' }} Berita</span
          >
        </template>

        <template #body>
          <UForm
            :schema="AnnouncementFormSchema"
            :state="form"
            class="w-full space-y-6"
            @submit="saveData"
          >
            <UFormField name="title" label="Judul Berita" required>
              <UInput v-model="form.title" placeholder="Judul Berita" />
            </UFormField>

            <UFormField name="for" label="Ditujukan Pada">
              <USelect
                v-model="form.for"
                :items="dropdownRT"
                multiple
                value-key="key"
                value-label="label"
                class="w-full"
                searchable
                placeholder="Pilih RT"
              />
            </UFormField>

            <UFormField name="image">
              <div class="w-full">
                <div
                  v-if="form.image"
                  class="group relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                >
                  <img
                    :src="form.image"
                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div
                    class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                  >
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
                  v-model="imageFile"
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

            <UFormField name="body" label="Deskripsi">
              <UTextarea
                v-model="form.body"
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
    </div>

    <div>
      <UTable
        ref="table"
        :data="dataAnnouncementCard"
        :columns="columnsNewsTable"
        class="flex-1"
      >
        <template #image-cell="{ row }">
          <img
            :src="row.original.image"
            alt="Announcement Image"
            class="aspect-video w-32 object-cover rounded-md"
          />
        </template>
        <template #for-cell="{ row }">
          <UBadge
            v-if="row.original.for.length === 0"
            variant="subtle"
            color="success"
          >
            Semua RT
          </UBadge>

          <UBadge v-else color="success" variant="subtle">
            {{ row.original.for }}
          </UBadge>
        </template>
        <template #created_at-cell="{ row }">
          <span>{{
            row.original.created_at
              ? format(row.original.created_at, 'dd MMM yyyy')
              : ''
          }}</span>
        </template>
        <template #action-cell="{ row }">
          <UButton
            v-if="!row.original.published_at"
            icon="mdi:publish"
            variant="ghost"
            color="success"
            @click="publishHandler(row.original)"
          />

          <UButton
            v-if="row.original.published_at"
            icon="mdi:download"
            variant="ghost"
            color="error"
            @click="unpublishHandler(row.original)"
          />

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
