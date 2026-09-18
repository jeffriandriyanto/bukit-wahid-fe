<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { perPageLimit } from '~/const/utils'
import { fileUpload } from '~/services/files'

use([
  CanvasRenderer,
  BarChart,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

definePageMeta({ middleware: ['auth'] })

// --- COMPOSABLES & UTILS ---
const { dropdownToOrganization, getDropdownToOrganization } = useApiDropdown()
const toast = useToast()

// --- STATE ---
const loading = ref(false)
const isOpen = ref(false)
const dataVoting = ref<any[]>([])
const isEditing = ref(false)
const optionLoading = ref(false)
const showAddOptionForm = ref(false)

const isOpenVote = ref()
const selectedVote = ref()

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
  rt: [] as string[],
  is_published: false,
  published_at: null as string | null
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
  { key: 'draft', label: 'Draft' },
  { key: 'ongoing', label: 'Sedang Berlangsung' },
  { key: 'done', label: 'Selesai' }
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
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'end_date', header: 'Batas Akhir' },
  { accessorKey: 'action', header: 'Aksi' }
]

const getVotingStatus = (row: any) => {
  if (!row.is_published && !row.published_at) {
    return { label: 'Draft', color: 'neutral' as const, variant: 'subtle' as const }
  }
  const now = new Date()
  const end = new Date(row.end_date + ' ' + (row.end_time || '23:59'))
  if (now > end) {
    return { label: 'Selesai', color: 'error' as const, variant: 'subtle' as const }
  }
  return { label: 'Berlangsung', color: 'success' as const, variant: 'subtle' as const }
}

const publishLoading = ref(false)

const publishVoting = async (votingId?: string) => {
  const targetId = votingId || form.id
  if (!targetId) return

  if (targetId === form.id && votingOptions.value.length < 2) {
    return toast.add({
      title: 'Gagal Publikasi',
      description: 'Voting harus memiliki minimal 2 opsi pilihan sebelum dipublikasikan.',
      color: 'error'
    })
  }

  if (!confirm('Apakah Anda yakin ingin mempublikasikan voting ini? Notifikasi push akan segera dikirimkan kepada seluruh warga terkait.')) {
    return
  }

  publishLoading.value = true
  try {
    const res = await useApi(`/voting/publish/${targetId}`, { method: 'PUT' })
    if (res.status === 1) {
      toast.add({
        title: 'Berhasil Dipublikasikan',
        description: 'Voting telah aktif dan notifikasi dikirim ke warga.',
        color: 'success'
      })
      form.is_published = true
      form.published_at = res.data?.published_at || new Date().toISOString()
      getData()
    } else {
      toast.add({
        title: res.message || 'Gagal mempublikasikan voting',
        color: 'error'
      })
    }
  } catch (err: any) {
    toast.add({
      title: err.message || 'Gagal mempublikasikan voting',
      color: 'error'
    })
  } finally {
    publishLoading.value = false
  }
}

const unpublishVoting = async (votingId?: string) => {
  const targetId = votingId || form.id
  if (!targetId) return

  if (!confirm('Apakah Anda yakin ingin menarik voting ini kembali ke status Draft?')) {
    return
  }

  publishLoading.value = true
  try {
    const res = await useApi(`/voting/unpublish/${targetId}`, { method: 'PUT' })
    if (res.status === 1) {
      toast.add({
        title: 'Status Diubah ke Draft',
        description: 'Voting berhasil ditarik ke draf.',
        color: 'success'
      })
      form.is_published = false
      form.published_at = null
      getData()
    } else {
      toast.add({
        title: res.message || 'Gagal menarik voting ke draft',
        color: 'error'
      })
    }
  } catch (err: any) {
    toast.add({
      title: err.message || 'Gagal menarik voting ke draft',
      color: 'error'
    })
  } finally {
    publishLoading.value = false
  }
}

// --- API ACTIONS: VOTING MASTER ---
const getData = async () => {
  loading.value = true
  try {
    const res = await useApi('/voting', {
      params: {
        page: pagination.value.current_page,
        limit: pagination.value.per_page,
        status: selectedStatus.value
      }
    })
    if (res.status === 1) {
      dataVoting.value = res.data
      if (res.pagination) { pagination.value = { ...res.pagination } }
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
    const res = await useApi(url, { method, body: payload })

    if (res.status === 1) {
      toast.add({
        title: isEditing.value ? 'Voting berhasil diperbarui' : 'Draft voting berhasil dibuat',
        color: 'success'
      })
      if (!isEditing.value) {
        form.id = res.data.id
        form.is_published = !!res.data.is_published
        form.published_at = res.data.published_at || null
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
    const res = await useApi(`/voting-option/${votingId}`)
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

    const res = await useApi('/voting-option', {
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

    const res = await useApi(`/voting-option/${opt.id}`, {
      method: 'PUT',
      body: payload
    })

    if (res.status === 1) {
      delete opt._newFile // Bersihkan temp file
      toast.add({ title: 'Opsi diperbarui', color: 'success' })
      getOptions(form.id) // Refresh data
    }
  } catch {
    toast.add({ title: 'Gagal update opsi', color: 'error' })
  } finally {
    optionLoading.value = false
  }
}

const deleteOption = async (id: string) => {
  if (!confirm('Hapus opsi ini?')) return
  const res = await useApi(`/voting-option/${id}`, { method: 'DELETE' })
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
  if (!dropdownToOrganization.value?.length) {
    getDropdownToOrganization()
  }
  Object.assign(form, {
    id: row.id,
    title: row.title,
    description: row.description,
    image: row.image || '',
    end_date: row.end_date,
    end_time: row.end_time,
    rt: row.for || [],
    is_published: !!row.is_published,
    published_at: row.published_at || null
  })
  getOptions(row.id)
  isOpen.value = true
}

const openAddModal = () => {
  isEditing.value = false
  mainImageFile.value = null
  showAddOptionForm.value = false
  if (!dropdownToOrganization.value?.length) {
    getDropdownToOrganization()
  }
  Object.assign(form, {
    id: '',
    title: '',
    description: '',
    image: '',
    end_date: '',
    end_time: '',
    rt: [],
    is_published: false,
    published_at: null
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

const activeOptionTab = ref<string>('')

const totalVotes = computed(() => {
  return votingOptions.value.reduce((acc, curr) => acc + (curr.votes_count || 0), 0)
})

const sortedVotingOptions = computed(() => {
  return [...votingOptions.value].sort(
    (a, b) => (b.votes_count || 0) - (a.votes_count || 0)
  )
})

const optionsWithPercent = computed(() => {
  const total = totalVotes.value
  return sortedVotingOptions.value.map((opt, index) => {
    const count = opt.votes_count || 0
    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
    return {
      ...opt,
      ranking: index + 1,
      percentage: Number(percent),
      percentageLabel: `${percent}%`
    }
  })
})

const barChartOption = computed(() => {
  const titles = votingOptions.value.map((opt) => opt.title)
  const votes = votingOptions.value.map((opt) => opt.votes_count || 0)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[0]
        const count = item.value || 0
        const total = totalVotes.value
        const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
        return `<b>${item.name}</b><br/>Perolehan: <b>${count} Suara</b> (${percent}%)`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: titles,
      axisLabel: {
        interval: 0,
        rotate: titles.some((t) => (t?.length || 0) > 10) ? 20 : 0,
        fontSize: 11,
        color: '#4b5563'
      },
      axisLine: { lineStyle: { color: '#e5e7eb' } }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#9ca3af', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } }
    },
    series: [
      {
        name: 'Perolehan Suara',
        type: 'bar',
        data: votes,
        barMaxWidth: 38,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: (params: any) => {
            const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2']
            return colors[params.dataIndex % colors.length]
          }
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}',
          fontWeight: 'bold',
          color: '#374151'
        }
      }
    ]
  }
})

const activeOption = computed(() => {
  if (!votingOptions.value.length) return null
  if (!activeOptionTab.value) return votingOptions.value[0]
  return (
    votingOptions.value.find((opt) => opt.id === activeOptionTab.value) ||
    votingOptions.value[0]
  )
})

const activeOptionVotes = computed(() => {
  return activeOption.value?.votes || []
})

const formatVoteTime = (dateStr: string) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

const viewVote = async (row: any) => {
  isOpenVote.value = true
  votingOptions.value = []
  selectedVote.value = row
  await getOptions(row.id)
  if (votingOptions.value.length > 0) {
    activeOptionTab.value = votingOptions.value[0].id
  }
}

const voterTableColumns = [
  { accessorKey: 'no', header: 'No' },
  { accessorKey: 'name', header: 'Nama Pemilih' },
  { accessorKey: 'address', header: 'Alamat / RT' },
  { accessorKey: 'created_at', header: 'Waktu Memilih' }
]

watch(
  () => pagination.value.per_page,
  () => {
    pagination.value.current_page = 1
    getData()
  }
)

onMounted(() => {
  getDropdownToOrganization()
  getData()
})
</script>

<template>
  <div class="space-y-4">
    <SharedHeaderBg>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary-50 rounded-lg">
          <UIcon name="i-lucide-vote" class="w-5 h-5 text-primary-600" />
        </div>
        <h2 class="text-lg font-bold text-gray-900">
          Manajemen E-Voting Warga
        </h2>
      </div>

      <div class="w-64">
        <USelect
          v-model="selectedStatus"
          :items="statusOptions"
          placeholder="Filter Status"
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
    </SharedHeaderBg>

    <div
      class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <UTable :data="dataVoting" :columns="votingTable" :loading="loading">
        <template #title-cell="{ row }">
          <div class="font-medium text-gray-900">{{ row.original.title }}</div>
          <div class="text-xs text-gray-400 truncate max-w-xs">
            {{ row.original.description }}
          </div>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="getVotingStatus(row.original).color"
            :variant="getVotingStatus(row.original).variant"
            size="sm"
          >
            {{ getVotingStatus(row.original).label }}
          </UBadge>
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
          <div class="text-xs text-gray-400">
            {{ row.original.end_time }} WIB
          </div>
        </template>

        <template #action-cell="{ row }">
          <div class="flex items-center gap-1">
            <UButton
              v-if="!row.original.is_published"
              icon="i-lucide-send"
              variant="soft"
              color="primary"
              size="xs"
              :loading="publishLoading"
              title="Publikasikan Voting"
              @click="publishVoting(row.original.id)"
            />
            <UButton
              v-else
              icon="i-lucide-undo-2"
              variant="soft"
              color="neutral"
              size="xs"
              :loading="publishLoading"
              title="Tarik ke Draft"
              @click="unpublishVoting(row.original.id)"
            />

            <UButton
              icon="i-heroicons-pencil-square"
              variant="ghost"
              color="neutral"
              @click="openDetail(row.original)"
            />

            <UButton
              icon="i-heroicons-eye"
              variant="soft"
              color="neutral"
              @click="viewVote(row.original)"
            />
          </div>
        </template>
      </UTable>
    </div>

    <div class="flex justify-between">
      <div class="flex items-center gap-2 text-sm text-gray-600">
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

    <UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-3xl' }">
      <template #header>
        <div class="flex items-center justify-between w-full pr-4">
          <div class="flex flex-col">
            <span class="text-xs text-gray-400 uppercase font-bold">{{
              isEditing ? 'Edit Voting' : 'Buat Voting Baru'
            }}</span>
            <span class="text-lg font-bold">{{
              form.title || 'Draft E-Voting'
            }}</span>
          </div>
          <UBadge
            v-if="form.id"
            :color="form.is_published ? 'success' : 'neutral'"
            variant="subtle"
          >
            {{ form.is_published ? 'Terpublikasi' : 'Draft' }}
          </UBadge>
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
                  >
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
              <USelectMenu
                v-model="form.rt"
                :items="dropdownToOrganization"
                multiple
                value-key="key"
                label-key="label"
                placeholder="Pilih Target RT / Majelis"
                class="w-full"
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

          <div v-if="form.id" class="space-y-4">
            <div class="flex justify-between items-center">
              <p class="text-xs font-bold text-gray-400 uppercase">Opsi Pilihan (Minimal 2 Opsi)</p>
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
                <div class="relative group h-20 w-20 shrink-0">
                  <img
                    :src="
                      newOptionPreview ||
                      'https://placehold.co/100x100?text=Pilih+Foto'
                    "
                    class="h-full w-full object-cover rounded-lg border-2 border-white shadow-sm bg-gray-200"
                  >
                  <label
                    class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer rounded-lg transition-opacity"
                  >
                    <input
                      type="file"
                      class="hidden"
                      accept="image/*"
                      @change="handleNewOptionFile"
                    >
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
                    >
                    <label
                      class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer rounded-lg transition-opacity"
                    >
                      <input
                        type="file"
                        class="hidden"
                        accept="image/*"
                        @change="
                          (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file) handleOptionImageChange(file, opt)
                          }
                        "
                      >
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

            <!-- Publish / Draft Status Card -->
            <div
              v-if="!form.is_published"
              class="p-4 rounded-xl border border-primary-200 bg-primary-50/60 flex flex-col sm:flex-row justify-between items-center gap-3 mt-4"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-primary-100 text-primary-700">
                  <UIcon name="i-lucide-send" class="w-5 h-5" />
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-900">Publikasikan Voting</p>
                  <p class="text-xs text-gray-600">
                    {{
                      votingOptions.length >= 2
                        ? 'Data dan opsi sudah lengkap. Klik tombol di samping untuk mempublikasikan dan mengirim notifikasi ke warga.'
                        : `Tambahkan minimal ${Math.max(0, 2 - votingOptions.length)} opsi lagi agar dapat dipublikasikan.`
                    }}
                  </p>
                </div>
              </div>
              <UButton
                color="primary"
                icon="i-lucide-send"
                :loading="publishLoading"
                :disabled="votingOptions.length < 2"
                @click="publishVoting()"
              >
                Publikasikan Sekarang
              </UButton>
            </div>

            <div
              v-else
              class="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex flex-col sm:flex-row justify-between items-center gap-3 mt-4"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <UIcon name="i-lucide-check-circle-2" class="w-5 h-5" />
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-900">Voting Telah Aktif</p>
                  <p class="text-xs text-gray-600">
                    Warga dapat melihat dan memberikan suara. Anda dapat menarik kembali voting ke draft jika ada perubahan.
                  </p>
                </div>
              </div>
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-undo-2"
                :loading="publishLoading"
                @click="unpublishVoting()"
              >
                Tarik ke Draft
              </UButton>
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

    <UModal v-model:open="isOpenVote" :ui="{ content: 'sm:max-w-4xl' }">
      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full pr-4">
          <div class="flex flex-col">
            <span
              class="text-xs text-gray-400 uppercase font-extrabold tracking-wider"
              >Laporan Hasil E-Voting</span
            >
            <span class="text-xl font-bold text-gray-900">{{
              selectedVote?.title
            }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UBadge
              :color="selectedVote ? getStatusColor(selectedVote.start_date, selectedVote.end_date) : 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{
                selectedVote && new Date() > new Date(selectedVote.end_date + ' ' + (selectedVote.end_time || '23:59'))
                  ? 'Selesai'
                  : 'Sedang Berjalan'
              }}
            </UBadge>
          </div>
        </div>
      </template>

      <template #body>
        <div class="space-y-6">
          <p v-if="selectedVote?.description" class="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
            {{ selectedVote?.description }}
          </p>

          <!-- Top Summary Metrics Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
              <div class="p-2.5 rounded-lg bg-blue-500 text-white">
                <UIcon name="i-lucide-vote" class="w-5 h-5" />
              </div>
              <div>
                <p class="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Total Suara Masuk</p>
                <p class="text-xl font-black text-gray-900">{{ totalVotes }} <span class="text-xs font-normal text-gray-500">Suara</span></p>
              </div>
            </div>

            <div class="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
              <div class="p-2.5 rounded-lg bg-emerald-500 text-white">
                <UIcon name="i-lucide-trophy" class="w-5 h-5" />
              </div>
              <div class="overflow-hidden">
                <p class="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Suara Terbanyak</p>
                <p class="text-sm font-bold text-gray-900 truncate">
                  {{ optionsWithPercent[0]?.title || '-' }}
                </p>
                <p v-if="optionsWithPercent[0]" class="text-[11px] text-emerald-700 font-semibold">
                  {{ optionsWithPercent[0].votes_count || 0 }} Suara ({{ optionsWithPercent[0].percentageLabel }})
                </p>
              </div>
            </div>

            <div class="p-4 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center gap-3">
              <div class="p-2.5 rounded-lg bg-purple-500 text-white">
                <UIcon name="i-lucide-list-ordered" class="w-5 h-5" />
              </div>
              <div>
                <p class="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">Total Pilihan</p>
                <p class="text-xl font-black text-gray-900">{{ votingOptions.length }} <span class="text-xs font-normal text-gray-500">Kandidat / Opsi</span></p>
              </div>
            </div>
          </div>

          <!-- Section 1: Visualisasi Perolehan Suara (Chart Batang) -->
          <section class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2">
                <UIcon name="i-lucide-bar-chart-3" class="w-4 h-4 text-primary-600" />
                Visualisasi Perolehan Suara
              </h3>
              <span class="text-xs text-gray-500">Diagram Batang & Persentase</span>
            </div>

            <div v-if="optionLoading" class="h-64 flex flex-col items-center justify-center gap-2">
              <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-primary-500" />
              <p class="text-xs text-gray-400">Menarik data hasil voting...</p>
            </div>

            <div v-else-if="votingOptions.length === 0" class="h-48 flex items-center justify-center border-2 border-dashed rounded-xl bg-gray-50">
              <p class="text-xs text-gray-400">Belum ada data opsi voting</p>
            </div>

            <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <!-- Left: ECharts Bar Chart -->
              <div class="lg:col-span-7 h-64 w-full">
                <ClientOnly>
                  <VChart :option="barChartOption" class="h-full w-full" autoresize />
                </ClientOnly>
              </div>

              <!-- Right: Ranked Progress Bars List -->
              <div class="lg:col-span-5 space-y-3">
                <div
                  v-for="(opt, idx) in optionsWithPercent"
                  :key="opt.id"
                  class="p-3 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition-all space-y-1.5"
                >
                  <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2 min-w-0">
                      <span
                        class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        :class="
                          idx === 0
                            ? 'bg-yellow-400 text-yellow-900 font-black'
                            : idx === 1
                              ? 'bg-gray-300 text-gray-800'
                              : idx === 2
                                ? 'bg-amber-600 text-white'
                                : 'bg-gray-200 text-gray-600'
                        "
                      >
                        {{ idx + 1 }}
                      </span>
                      <UAvatar v-if="opt.image" :src="opt.image" size="2xs" />
                      <span class="font-bold text-gray-900 truncate">{{ opt.title }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0 ml-2">
                      <span class="font-mono font-bold text-gray-800">{{ opt.votes_count || 0 }} Suara</span>
                      <UBadge
                        :color="idx === 0 ? 'primary' : 'neutral'"
                        variant="soft"
                        size="xs"
                        class="font-mono font-bold"
                      >
                        {{ opt.percentageLabel }}
                      </UBadge>
                    </div>
                  </div>

                  <!-- Progress Bar -->
                  <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-700"
                      :class="
                        idx === 0
                          ? 'bg-gradient-to-r from-blue-500 to-primary-600'
                          : idx === 1
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                            : idx === 2
                              ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                              : 'bg-gradient-to-r from-purple-500 to-indigo-600'
                      "
                      :style="{ width: `${Math.max(opt.percentage, 1)}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Section 2: Detail Voting per Opsi (Tab per Opsi) -->
          <section class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2">
                <UIcon name="i-lucide-users" class="w-4 h-4 text-primary-600" />
                Detail Pemilih Berdasarkan Opsi
              </h3>
              <span class="text-xs text-gray-500">Pilih tab opsi untuk melihat daftar pemilih</span>
            </div>

            <!-- Option Tabs Bar -->
            <div v-if="votingOptions.length > 0" class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200">
              <button
                v-for="opt in votingOptions"
                :key="opt.id"
                type="button"
                @click="activeOptionTab = opt.id"
                :class="[
                  'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border',
                  activeOptionTab === opt.id
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                ]"
              >
                <UAvatar v-if="opt.image" :src="opt.image" size="2xs" />
                <span>{{ opt.title }}</span>
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full text-[10px] font-extrabold',
                    activeOptionTab === opt.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 text-gray-700'
                  ]"
                >
                  {{ opt.votes_count || 0 }}
                </span>
              </button>
            </div>

            <!-- Active Option Content -->
            <div v-if="activeOption" class="space-y-3">
              <div class="p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-3">
                  <UAvatar v-if="activeOption.image" :src="activeOption.image" size="sm" class="ring-2 ring-white shadow-xs" />
                  <div>
                    <h4 class="text-sm font-bold text-gray-900">{{ activeOption.title }}</h4>
                    <p v-if="activeOption.description" class="text-xs text-gray-500">{{ activeOption.description }}</p>
                  </div>
                </div>
                <div class="text-xs text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 font-medium shrink-0">
                  Total Pemilih: <b class="text-primary-600 font-bold font-mono">{{ activeOptionVotes.length }} Warga</b>
                </div>
              </div>

              <!-- Voters Table -->
              <UTable
                v-if="activeOptionVotes.length > 0"
                :data="activeOptionVotes"
                :columns="voterTableColumns"
                class="border rounded-xl overflow-hidden"
                :ui="{
                  thead: 'bg-gray-100/90',
                  th: 'text-gray-900 font-bold uppercase text-[10px] py-3',
                  td: 'py-3 text-xs'
                }"
              >
                <template #no-cell="{ row }">
                  <span class="text-gray-500 font-mono font-medium">{{ row.index + 1 }}</span>
                </template>

                <template #name-cell="{ row }">
                  <div class="flex items-center gap-2.5">
                    <UAvatar
                      :src="row.original.user?.person?.avatar"
                      :alt="row.original.user?.person?.name || row.original.user?.username || 'Warga'"
                      size="xs"
                      class="ring-1 ring-gray-200"
                    />
                    <div class="flex flex-col">
                      <span class="font-bold text-gray-800">
                        {{ row.original.user?.person?.name || row.original.user?.username || 'Warga' }}
                      </span>
                      <span v-if="row.original.user?.person?.phone" class="text-[10px] text-gray-400">
                        {{ row.original.user.person.phone }}
                      </span>
                    </div>
                  </div>
                </template>

                <template #address-cell="{ row }">
                  <div class="text-xs text-gray-700">
                    <span v-if="row.original.user?.address?.kavling" class="font-medium">
                      Kav. {{ row.original.user.address.kavling }}
                    </span>
                    <span v-if="row.original.user?.address?.rt" class="text-gray-500 text-[11px] ml-1">
                      (RT {{ row.original.user.address.rt }})
                    </span>
                    <span v-if="!row.original.user?.address?.kavling && !row.original.user?.address?.rt" class="text-gray-400 italic">
                      -
                    </span>
                  </div>
                </template>

                <template #created_at-cell="{ row }">
                  <span class="text-gray-600 font-medium">
                    {{ formatVoteTime(row.original.created_at) }}
                  </span>
                </template>
              </UTable>

              <!-- Empty State -->
              <div
                v-else
                class="py-10 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-gray-50/50 text-center"
              >
                <div class="p-3 rounded-full bg-gray-100 text-gray-400 mb-2">
                  <UIcon name="i-lucide-users" class="w-6 h-6" />
                </div>
                <p class="text-xs font-bold text-gray-700">Belum ada suara untuk opsi ini</p>
                <p class="text-[11px] text-gray-400 mt-0.5">
                  Warga yang memilih pilihan ini akan otomatis terdata dan ditampilkan di daftar ini.
                </p>
              </div>
            </div>
          </section>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end w-full px-2">
          <UButton
            color="neutral"
            variant="soft"
            class="font-bold"
            @click="isOpenVote = false"
          >
            Tutup Laporan
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

