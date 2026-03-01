<script setup lang="ts">
import { fileUpload } from '~/services/files'

definePageMeta({ middleware: ['auth'] })

// --- COMPOSABLES & UTILS ---
const { dropdownRT, getDropdownRT } = useApiDropdown()
const toast = useToast()

// --- STATE ---
const loading = ref(false)
const isOpen = ref(false)
const dataVoting = ref<any[]>([])
const isEditing = ref(false)
const optionLoading = ref(false)
const showAddOptionForm = ref(false)

// Image Files State (Raw Files)
const mainImageFile = ref<File | null>(null)
const newOptionImageFile = ref<File | null>(null)
const newOptionPreview = ref('') // Tambahkan ini untuk menampung Blob URL

// Form State (Voting Header)
const form = reactive({
  id: '',
  title: '',
  description: '',
  image: '', // URL String
  end_date: '',
  end_time: '',
  rt: [] as string[]
})

// Options State
const votingOptions = ref<any[]>([])
const newOptionForm = reactive({
  title: '',
  description: '',
  image: ''
})

// Pagination & Filter
const selectedStatus = ref('')
const statusOptions = ref<any[]>([
  { key: null, label: 'Semua Status' },
  { key: 'ongoing', label: 'Sedang Berlangsung' }
])
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

// --- TABLE COLUMNS ---
const votingTable = [
  { accessorKey: 'title', header: 'Judul Voting' },
  { accessorKey: 'author.name', header: 'Pembuat' },
  { accessorKey: 'end_date', header: 'Batas Akhir' },
  { accessorKey: 'action', header: 'Aksi' }
]

// --- API ACTIONS: VOTING MASTER ---
const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/voting', {
      params: {
        page: pagination.value.current_page,
        per_page: pagination.value.per_page,
        status: selectedStatus.value
      }
    })
    if (res.status === 1) {
      dataVoting.value = res.data
      pagination.value = { ...res.pagination }
    }
  } finally {
    loading.value = false
  }
}

const saveVoting = async () => {
  loading.value = true
  try {
    // 1. Upload Gambar Header jika ada file baru
    let finalImageUrl = form.image
    if (mainImageFile.value) {
      const uploadRes = await fileUpload(mainImageFile.value)
      if (uploadRes) {
        finalImageUrl = uploadRes
        form.image = uploadRes
        mainImageFile.value = null
      }
    }

    const payload = {
      title: form.title,
      description: form.description,
      image: finalImageUrl,
      end_date: form.end_date,
      end_time: form.end_time,
      for: form.rt
    }

    const url = isEditing.value ? `/voting/${form.id}` : '/voting'
    const method = isEditing.value ? 'PUT' : 'POST'
    const res = await useApi<any>(url, { method, body: payload })

    if (res.status === 1) {
      toast.add({ title: 'Voting berhasil disimpan', color: 'success' })
      if (!isEditing.value) {
        form.id = res.data.id
        isEditing.value = true
      }
      getData()
    }
  } catch (err: any) {
    toast.add({ title: err.message || 'Gagal menyimpan data', color: 'error' })
  } finally {
    loading.value = false
  }
}

// --- API ACTIONS: OPTIONS ---

const getOptions = async (votingId: string) => {
  optionLoading.value = true
  try {
    const res = await useApi<any>(`/voting-option/${votingId}`)
    if (res.status === 1) votingOptions.value = res.data
  } finally {
    optionLoading.value = false
  }
}

const submitNewOption = async () => {
  if (!newOptionForm.title)
    return toast.add({ title: 'Judul opsi harus diisi', color: 'error' })

  optionLoading.value = true
  try {
    let finalOptionUrl = ''
    if (newOptionImageFile.value) {
      const uploadRes = await fileUpload(newOptionImageFile.value)
      if (uploadRes) finalOptionUrl = uploadRes
    }

    const payload = {
      voting_id: form.id,
      title: newOptionForm.title,
      description: newOptionForm.description,
      image: finalOptionUrl
    }

    const res = await useApi<any>('/voting-option', {
      method: 'POST',
      body: payload
    })

    if (res.status === 1) {
      toast.add({ title: 'Opsi berhasil ditambahkan', color: 'success' })
      // Reset form
      newOptionForm.title = ''
      newOptionForm.description = ''
      newOptionImageFile.value = null // Preview otomatis balik ke placeholder
      showAddOptionForm.value = false
      getOptions(form.id)
    }
  } finally {
    optionLoading.value = false
  }
}

const handleNewOptionFile = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    newOptionImageFile.value = file
    // Buat preview URL
    newOptionPreview.value = URL.createObjectURL(file)
  }
}

const resetNewOptionForm = () => {
  newOptionForm.title = ''
  newOptionForm.description = ''
  newOptionImageFile.value = null
  newOptionPreview.value = ''
  showAddOptionForm.value = false
}

const handleOptionImageChange = (file: File, opt: any) => {
  opt._newFile = file // Simpan file sementara di object option
  opt.image = URL.createObjectURL(file) // Preview sementara
}

// Update fungsi updateOption untuk handle upload file baru
const updateOption = async (opt: any) => {
  try {
    optionLoading.value = true
    let finalImageUrl = opt.image

    // Jika ada file baru yang dipilih di baris ini
    if (opt._newFile) {
      const uploadRes = await fileUpload(opt._newFile)
      if (uploadRes) finalImageUrl = uploadRes
    }

    const payload = {
      voting_id: form.id,
      title: opt.title,
      image: finalImageUrl,
      description: opt.description
    }

    const res = await useApi<any>(`/voting-option/${opt.id}`, {
      method: 'PUT',
      body: payload
    })

    if (res.status === 1) {
      delete opt._newFile // Bersihkan temp file
      toast.add({ title: 'Opsi diperbarui', color: 'success' })
      getOptions(form.id) // Refresh data
    }
  } catch (err) {
    toast.add({ title: 'Gagal update opsi', color: 'error' })
  } finally {
    optionLoading.value = false
  }
}

const deleteOption = async (id: string) => {
  if (!confirm('Hapus opsi ini?')) return
  const res = await useApi<any>(`/voting-option/${id}`, { method: 'DELETE' })
  if (res.status === 1) getOptions(form.id)
}

// --- UI HANDLERS ---

const clearMainImage = () => {
  form.image = ''
  mainImageFile.value = null
}

const openDetail = (row: any) => {
  isEditing.value = true
  mainImageFile.value = null
  Object.assign(form, {
    id: row.id,
    title: row.title,
    description: row.description,
    image: row.image || '',
    end_date: row.end_date,
    end_time: row.end_time,
    rt: row.for || []
  })
  getOptions(row.id)
  isOpen.value = true
}

const openAddModal = () => {
  isEditing.value = false
  mainImageFile.value = null
  showAddOptionForm.value = false
  Object.assign(form, {
    id: '',
    title: '',
    description: '',
    image: '',
    end_date: '',
    end_time: '',
    rt: []
  })
  votingOptions.value = []
  isOpen.value = true
}

const getStatusColor = (start: string, end: string) => {
  const now = new Date()
  if (now < new Date(start)) return 'warning'
  if (now > new Date(end)) return 'error'
  return 'success'
}

onMounted(() => {
  getDropdownRT()
  getData()
})
</script>

<template>
  <div class="space-y-4 p-4">
    <div class="flex justify-between items-end">
      <div class="w-64">
        <label class="text-[10px] font-bold text-gray-400 uppercase mb-1 block"
          >Filter Status</label
        >
        <USelect
          v-model="selectedStatus"
          :items="statusOptions"
          label-key="label"
          value-key="key"
          @update:model-value="
            () => {
              pagination.current_page = 1
              getData()
            }
          "
        />
      </div>
      <UButton color="primary" icon="i-lucide-plus-circle" @click="openAddModal"
        >Tambah E-Voting</UButton
      >
    </div>

    <UTable :data="dataVoting" :columns="votingTable" :loading="loading">
      <template #title-cell="{ row }">
        <div class="font-medium text-gray-900">{{ row.original.title }}</div>
        <div class="text-xs text-gray-400 truncate max-w-xs">
          {{ row.original.description }}
        </div>
      </template>

      <template #end_date-cell="{ row }">
        <div
          :class="`text-sm font-semibold text-${getStatusColor(
            row.original.start_date,
            row.original.end_date
          )}-500`"
        >
          {{ row.original.end_date }}
        </div>
        <div class="text-xs text-gray-400">{{ row.original.end_time }} WIB</div>
      </template>

      <template #action-cell="{ row }">
        <UButton
          icon="i-heroicons-pencil-square"
          variant="ghost"
          color="neutral"
          @click="openDetail(row.original)"
        />
      </template>
    </UTable>

    <UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-3xl' }">
      <template #header>
        <div class="flex flex-col">
          <span class="text-xs text-gray-400 uppercase font-bold">{{
            isEditing ? 'Edit Voting' : 'Buat Voting Baru'
          }}</span>
          <span class="text-lg font-bold">{{
            form.title || 'Draft E-Voting'
          }}</span>
        </div>
      </template>

      <template #body>
        <div class="space-y-6">
          <div
            class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100"
          >
            <UFormField label="Gambar Voting" class="md:col-span-2">
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
                      @click="clearMainImage"
                    />
                  </div>
                </div>
                <UFileUpload
                  v-else
                  v-model="mainImageFile"
                  accept="image/*"
                  :dropzone="true"
                  class="aspect-video"
                  icon="uil:image-upload"
                  :ui="{ base: 'bg-neutral-100' }"
                />
              </div>
            </UFormField>

            <UFormField label="Judul Voting" required class="md:col-span-2">
              <UInput v-model="form.title" placeholder="Masukkan judul..." />
            </UFormField>

            <UFormField label="Target RT (For)" required>
              <USelect
                v-model="form.rt"
                :items="dropdownRT"
                multiple
                value-key="key"
                label-key="label"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-2">
              <UFormField label="Tgl Berakhir" required
                ><UInput v-model="form.end_date" type="date"
              /></UFormField>
              <UFormField label="Jam Selesai" required
                ><UInput v-model="form.end_time" type="time"
              /></UFormField>
            </div>

            <UFormField label="Deskripsi" class="md:col-span-2">
              <UTextarea
                v-model="form.description"
                autoresize
                placeholder="Jelaskan tujuan voting ini..."
              />
            </UFormField>
          </div>

          <div class="flex justify-end">
            <UButton
              :loading="loading"
              icon="i-lucide-save"
              @click="saveVoting"
            >
              {{ isEditing ? 'Update Detail Voting' : 'Simpan & Lanjutkan' }}
            </UButton>
          </div>

          <UDivider label="Daftar Opsi Pilihan" />

          <div v-if="form.id" class="space-y-4">
            <div class="flex justify-between items-center">
              <p class="text-xs font-bold text-gray-400 uppercase">Opsi</p>
              <UButton
                v-if="!showAddOptionForm"
                size="xs"
                variant="soft"
                icon="i-lucide-plus"
                @click="showAddOptionForm = true"
                >Tambah Opsi Baru</UButton
              >
            </div>

            <div
              v-if="showAddOptionForm"
              class="p-4 border-2 border-dashed border-primary-200 rounded-xl bg-primary-50/40 space-y-4 mb-6"
            >
              <div
                class="flex flex-col md:flex-row gap-4 items-start md:items-center"
              >
                <div class="relative group h-20 w-20 flex-shrink-0">
                  <img
                    :src="
                      newOptionPreview ||
                      'https://placehold.co/100x100?text=Pilih+Foto'
                    "
                    class="h-full w-full object-cover rounded-lg border-2 border-white shadow-sm bg-gray-200"
                  />
                  <label
                    class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer rounded-lg transition-opacity"
                  >
                    <input
                      type="file"
                      class="hidden"
                      accept="image/*"
                      @change="handleNewOptionFile"
                    />
                    <UIcon name="i-lucide-camera" class="text-white text-xl" />
                  </label>
                  <button
                    v-if="newOptionPreview"
                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                    @click="
                      () => {
                        newOptionImageFile = null
                        newOptionPreview = ''
                      }
                    "
                  >
                    <UIcon name="i-lucide-x" class="text-xs" />
                  </button>
                </div>

                <div
                  class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
                >
                  <UFormField label="Judul Opsi Baru" required>
                    <UInput
                      v-model="newOptionForm.title"
                      variant="subtle"
                      placeholder="Contoh: Kandidat A"
                    />
                  </UFormField>
                  <UFormField label="Keterangan">
                    <UInput
                      v-model="newOptionForm.description"
                      variant="subtle"
                      placeholder="Deskripsi singkat..."
                    />
                  </UFormField>
                </div>

                <div
                  class="flex md:flex-col gap-2 border-l pl-4 self-stretch justify-center"
                >
                  <UButton
                    icon="i-lucide-check"
                    color="primary"
                    variant="solid"
                    size="sm"
                    :loading="optionLoading"
                    @click="submitNewOption"
                  />
                  <UButton
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="resetNewOptionForm"
                  />
                </div>
              </div>
            </div>

            <div>
              <div class="grid gap-4">
                <div
                  v-for="opt in votingOptions"
                  :key="opt.id"
                  class="flex flex-col md:flex-row gap-4 p-4 border rounded-xl bg-white shadow-sm items-start md:items-center"
                >
                  <div class="relative group h-20 w-20 shrink-0">
                    <img
                      :src="
                        opt.image ||
                        'https://placehold.co/100x100?text=No+Image'
                      "
                      class="h-full w-full object-cover rounded-lg border"
                    />
                    <label
                      class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer rounded-lg transition-opacity"
                    >
                      <input
                        type="file"
                        class="hidden"
                        accept="image/*"
                        @change="(e) => handleOptionImageChange((e.target as HTMLInputElement).files![0], opt)"
                      />
                      <UIcon
                        name="i-lucide-camera"
                        class="text-white text-xl"
                      />
                    </label>
                  </div>

                  <div
                    class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
                  >
                    <UFormField label="Judul Opsi">
                      <UInput
                        v-model="opt.title"
                        variant="subtle"
                        placeholder="Judul"
                      />
                    </UFormField>
                    <UFormField label="Deskripsi">
                      <UInput
                        v-model="opt.description"
                        variant="subtle"
                        placeholder="Deskripsi singkat"
                      />
                    </UFormField>
                  </div>

                  <div
                    class="flex md:flex-col gap-2 border-l pl-4 self-stretch justify-center"
                  >
                    <UButton
                      icon="i-lucide-save"
                      color="success"
                      variant="soft"
                      size="sm"
                      :loading="optionLoading"
                      @click="updateOption(opt)"
                    />
                    <UButton
                      icon="i-lucide-trash"
                      color="error"
                      variant="ghost"
                      size="sm"
                      @click="deleteOption(opt.id)"
                    />
                  </div>
                </div>
              </div>
              <p
                v-if="votingOptions.length === 0 && !showAddOptionForm"
                class="text-center text-sm text-gray-400 py-4 italic"
              >
                Belum ada opsi ditambahkan.
              </p>
            </div>
          </div>

          <UAlert
            v-else
            title="Langkah Selanjutnya"
            description="Silakan simpan header voting di atas terlebih dahulu untuk membuka menu pengelolaan opsi pilihan."
            icon="i-lucide-info"
            color="info"
            variant="soft"
          />
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end w-full">
          <UButton color="neutral" variant="ghost" @click="isOpen = false"
            >Tutup</UButton
          >
        </div>
      </template>
    </UModal>

    <div class="flex justify-end pt-4">
      <UPagination
        v-model:page="pagination.current_page"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        @update:page="getData"
      />
    </div>
  </div>
</template>
