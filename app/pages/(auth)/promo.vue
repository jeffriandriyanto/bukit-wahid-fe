<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { fileUpload } from '~/services/files'
import { perPageLimit } from '~/const/utils'

const { reveal: confirm } = useConfirmService()
const toast = useToast()
const { dropdownFamilyHead, getDropdownFamilyHead } = useApiDropdown()

/* =========================
  CONSTANTS & STATE
========================= */

const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingId = ref<string | null>(null)
const loading = ref(false)
const imageFile = ref<File | null>(null)

const PromoFormSchema = z.object({
  title: z.string().min(1, 'Judul promo wajib diisi'),
  author_id: z.string().min(1, 'Pemilik promo wajib dipilih'),
  body: z.string().min(1, 'Deskripsi promo wajib diisi'),
  duration: z.number().min(1, 'Durasi minimal 1 hari'),
  image: z.string().min(1, 'Gambar promo wajib diunggah'),
  published_at: z.string().optional(),
  publish_until: z.string().optional()
})

type PromoFormSchema = z.infer<typeof PromoFormSchema>

const dataPromos = ref<any[]>([])

const columnsPromoTable = [
  { accessorKey: 'image', header: 'Banner' },
  { accessorKey: 'title', header: 'Judul Promo' },
  { accessorKey: 'author', header: 'Pemilik' },
  { accessorKey: 'publish_until', header: 'Berlaku Sampai' },
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
  author_id: '',
  body: '',
  duration: 1,
  image: '',
  published_at: '',
  publish_until: ''
})

/* =========================
  LOGIC HANDLERS
========================= */

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi('/promo', {
      params: {
        page: pagination.value.current_page,
        limit: pagination.value.per_page
      },
      method: 'GET'
    })
    if (res.status === 1) {
      dataPromos.value = res.data
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
    const res = await useApi(`/promo/${row.id}`, { method: 'GET' })
    if (res.status === 1) {
      resetForm()
      mode.value = 'edit'
      editingId.value = row.id

      const detail = res.data
      Object.assign(form, {
        title: detail.title,
        author_id: detail.author_id,
        body: detail.body,
        duration: detail.duration,
        image: detail.image,
        published_at: detail.published_at,
        publish_until: detail.publish_until
      })

      isOpen.value = true
    }
  } catch (err: any) {
    toast.add({
      title: err?.message || 'Gagal mengambil detail promo',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const saveData = async (event: FormSubmitEvent<PromoFormSchema>) => {
  loading.value = true
  try {
    let finalImageUrl = form.image

    // Upload jika ada file baru
    if (imageFile.value) {
      const uploadRes = await fileUpload(imageFile.value)
      if (uploadRes) finalImageUrl = uploadRes
    }

    const payload: any = {
      title: event.data.title,
      author_id: event.data.author_id,
      body: event.data.body,
      duration: event.data.duration,
      image: finalImageUrl
    }

    // Jika mode edit, tambahkan field tanggal
    if (mode.value === 'edit') {
      payload.published_at = event.data.published_at
      payload.publish_until = event.data.publish_until
    }

    const url = mode.value === 'add' ? '/promo' : `/promo/${editingId.value}`
    const method = mode.value === 'add' ? 'POST' : 'PUT'

    const res = await useApi(url, { method, body: payload })

    if (res.status === 1) {
      toast.add({
        title: `Promo berhasil ${
          mode.value === 'add' ? 'ditambahkan' : 'diperbarui'
        }`,
        color: 'success'
      })
      isOpen.value = false
      getData()
    }
  } catch (err: any) {
    toast.add({ title: err?.message || 'Gagal menyimpan data', color: 'error' })
  } finally {
    loading.value = false
  }
}

const confirmDelete = async (row: any) => {
  const ok = await confirm({
    title: 'Hapus Promo?',
    description: `Apakah Anda yakin ingin menghapus promo "${row.title}"?`,
    confirmLabel: 'Hapus',
    color: 'error'
  })

  if (!ok) return

  try {
    loading.value = true
    const res = await useApi(`/promo/${row.id}`, { method: 'DELETE' })
    if (res.status === 1) {
      toast.add({ title: 'Promo berhasil dihapus', color: 'success' })
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
    author_id: '',
    body: '',
    duration: 1,
    image: '',
    published_at: '',
    publish_until: ''
  })
  imageFile.value = null
  editingId.value = null
}

const clearImage = () => {
  form.image = ''
  imageFile.value = null
}

watch(imageFile, (file) => {
  if (file) {
    form.image = URL.createObjectURL(file)
  }
})

watch(
  () => pagination.value.per_page,
  () => {
    pagination.value.current_page = 1
    getData()
  }
)

onMounted(() => {
  getDropdownFamilyHead()
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
        <h2 class="text-lg font-bold text-gray-900">Promosi & Iklan Warga</h2>
      </div>
      <UButton
        color="neutral"
        icon="i-lucide-plus-circle"
        @click="openAddModal"
      >
        Tambah Promo
      </UButton>
    </SharedHeaderBg>

    <UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-2xl' }">
      <template #header>
        <span class="font-bold"
          >{{ mode === 'add' ? 'Tambah' : 'Edit' }} Promo</span
        >
      </template>

      <template #body>
        <UForm
          :schema="PromoFormSchema"
          :state="form"
          class="space-y-6"
          @submit="saveData"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField name="title" label="Judul Promo" required>
              <UInput
                v-model="form.title"
                placeholder="Contoh: Diskon Warmindo 20%"
              />
            </UFormField>

            <UFormField
              name="author_id"
              label="Pemilik Promo (Kepala Keluarga)"
              required
            >
              <USelectMenu
                v-model="form.author_id"
                :items="dropdownFamilyHead"
                value-key="key"
                label-key="label"
                placeholder="Pilih warga..."
                searchable
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField name="duration" label="Durasi (Hari)" required>
              <UInput
                v-model.number="form.duration"
                type="number"
                placeholder="1"
              />
            </UFormField>

            <UFormField
              v-if="mode === 'edit'"
              name="published_at"
              label="Tanggal Publish"
            >
              <UInput v-model="form.published_at" type="datetime-local" />
            </UFormField>
          </div>

          <UFormField name="body" label="Isi Promo / Deskripsi" required>
            <UTextarea
              v-model="form.body"
              :rows="4"
              placeholder="Detail promo dan cara klaim..."
            />
          </UFormField>

          <UFormField name="image" label="Banner Promo" required>
            <div class="space-y-4">
              <div
                v-if="form.image"
                class="relative group aspect-video max-w-sm overflow-hidden rounded-xl border"
              >
                <img :src="form.image" class="h-full w-full object-cover" >
                <div
                  class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <UButton
                    color="error"
                    variant="solid"
                    size="xs"
                    icon="i-lucide-trash"
                    @click="clearImage"
                  />
                </div>
              </div>
              <UFileUpload
                v-else
                v-model="imageFile"
                accept="image/*"
                :dropzone="true"
                icon="i-lucide-image-plus"
                label="Unggah Banner Promo"
              />
            </div>
          </UFormField>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <UButton variant="ghost" @click="isOpen = false">Batal</UButton>
            <UButton type="submit" color="primary" :loading="loading"
              >Simpan Promo</UButton
            >
          </div>
        </UForm>
      </template>
    </UModal>

    <div
      class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <UTable
        :data="dataPromos"
        :columns="columnsPromoTable"
        :loading="loading"
      >
        <template #image-cell="{ row }">
          <div class="w-20 h-12 overflow-hidden rounded-md border">
            <img :src="row.original.image" class="w-full h-full object-cover" >
          </div>
        </template>

        <template #author-cell="{ row }">
          <span class="font-medium text-gray-700">{{
            row.original.author?.name
          }}</span>
        </template>

        <template #publish_until-cell="{ row }">
          <div class="text-xs text-gray-500">
            {{ formatDateTime(row.original.publish_until) }}
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
