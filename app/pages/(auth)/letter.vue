<script setup lang="ts">
import { perPageLimit } from '~/const/utils'

// Composables
const toast = useToast()

// State
const loading = ref(false)
const dataLetters = ref<any>([])
const selectedRT = ref()
const { dropdownRT, getDropdownRT } = useApiDropdown()

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

/* =========================
  COLUMNS DEFINITION
========================= */
const columns = [
  { accessorKey: 'code', header: 'Nomor Surat' },
  { accessorKey: 'regarding', header: 'Perihal' },
  { accessorKey: 'author', header: 'Pemohon' },
  { accessorKey: 'created_at', header: 'Tanggal Pengajuan' },
  { accessorKey: 'attachment', header: 'Lampiran' }
]

/* =========================
  METHODS
========================= */
const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/letter/admin', {
      params: {
        rt: selectedRT.value,
        page: pagination.value.current_page,
        limit: pagination.value.per_page,
      },
      method: 'GET'
    })

    if (res.status === 1) {
      dataLetters.value = res.data
      pagination.value = { ...res.pagination }
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

const openAttachment = (url: string | null) => {
  if (!url) {
    toast.add({ title: 'Lampiran tidak tersedia', color: 'error' })
    return
  }
  window.open(url, '_blank')
}

// Watchers
watch([selectedRT, () => pagination.value.per_page], () => {
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
  <div class="space-y-6">
    <SharedHeaderBg>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary-50 rounded-lg">
          <UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary-600" />
        </div>
        <h2 class="text-lg font-bold text-gray-900">Arsip Surat (Disetujui)</h2>
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
      </div>
    </SharedHeaderBg>

    <div
      class="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm"
    >
      <UTable :data="dataLetters" :columns="columns" :loading="loading">
        <template #code-cell="{ row }">
          <span class="font-mono text-xs font-semibold text-gray-700">
            {{ row.original.code }}
          </span>
        </template>

        <template #author-cell="{ row }">
          <div class="flex flex-col">
            <span class="font-medium text-gray-900">{{
              row.original.author?.name || '-'
            }}</span>
            <span class="text-[10px] text-gray-400 uppercase tracking-tight"
              >ID: {{ row.original.created_by.split('-')[0] }}</span
            >
          </div>
        </template>

        <template #created_at-cell="{ row }">
          <span class="text-sm text-gray-600">
            {{ formatDate(row.original.created_at) }}
          </span>
        </template>

        <template #attachment-cell="{ row }">
          <UButton
            v-if="row.original.attachment"
            icon="i-lucide-external-link"
            size="xs"
            variant="soft"
            color="primary"
            label="Lihat Dokumen"
            @click="openAttachment(row.original.attachment)"
          />
          <span v-else class="text-xs text-gray-400 italic"
            >Tidak ada file</span
          >
        </template>
      </UTable>
    </div>

    <div class="flex justify-between items-center">
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
        :max="7"
        @update:page="getData"
      />
    </div>
  </div>
</template>
