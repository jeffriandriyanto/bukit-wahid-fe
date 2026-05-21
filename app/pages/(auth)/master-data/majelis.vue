<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { watchWithFilter, debounceFilter } from '@vueuse/core'
import { perPageLimit } from '~/const/utils'

// ===== 1. SCHEMAS =====
const MajelisFormSchema = z.object({
  person: z.string().min(1, 'Person wajib dipilih')
})

type MajelisFormSchema = z.infer<typeof MajelisFormSchema>

// ===== 2. STATE =====
const { reveal: confirm } = useConfirmService()
const toast = useToast()

// Ambil data dropdown
const { dropdownFamilyHead, getDropdownFamilyHead } = useApiDropdown()

const isOpen = ref(false)
const loading = ref(false)

// Search & Filter States
const search = ref('')

const dataMajelis = ref<any[]>([])
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

const form = reactive<MajelisFormSchema>({
  person: ''
})

// ===== 3. ACTIONS =====
const resetForm = () => {
  form.person = ''
}

// Watchers for Search
watchWithFilter(
  search,
  () => {
    pagination.value.current_page = 1
    getData()
  },
  { eventFilter: debounceFilter(1000) }
)

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/majelis', {
      params: {
        search: search.value,
        page: pagination.value.current_page,
        limit: pagination.value.per_page
      },
      method: 'GET'
    })

    if (res.status === 1) {
      dataMajelis.value = res.data
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
  isOpen.value = true
}

const saveData = async (event: FormSubmitEvent<MajelisFormSchema>) => {
  try {
    loading.value = true

    const res = await useApi<any>('/majelis', {
      method: 'POST',
      body: {
        person: event.data.person
      }
    })

    if (res.status === 1) {
      toast.add({
        title: 'Berhasil menambah data majelis',
        color: 'success'
      })
      isOpen.value = false
      getData()
    }
  } catch (err: any) {
    toast.add({
      title: err?.message || 'Terjadi kesalahan server',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const confirmDelete = async (id: string) => {
  const ok = await confirm({
    title: 'Hapus Data Majelis?',
    description: 'Data majelis yang dihapus tidak dapat dikembalikan.',
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  try {
    loading.value = true
    const res = await useApi<any>(`/majelis/${id}`, { method: 'DELETE' })
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

const columnsMajelisTable = [
  { accessorKey: 'name', header: 'Nama Majelis' },
  { accessorKey: 'phone', header: 'No. Telepon' },
  { accessorKey: 'username', header: 'Username' },
  { id: 'action', header: 'Aksi', class: 'w-12' }
]

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
      <div
        class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full py-2"
      >
        <div class="flex items-center gap-3 shrink-0">
          <div class="p-2 bg-primary-50 rounded-lg">
            <UIcon name="i-lucide-users" class="w-5 h-5 text-primary-600" />
          </div>
          <h2 class="text-lg font-bold text-gray-900 whitespace-nowrap">
            Manajemen Data Majelis
          </h2>
        </div>

        <div class="flex gap-2">
          <!-- Search Area -->
          <div class="flex flex-1 items-center gap-2 min-w-0 max-w-sm">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Cari nama majelis..."
              class="flex-1"
              :ui="{ root: 'rounded-full' }"
            />
          </div>

          <!-- Actions Area -->
          <div class="flex items-center gap-2 shrink-0">
            <UButton
              color="primary"
              icon="i-lucide-plus"
              size="md"
              class="rounded-full px-5 shadow-sm font-bold"
              @click="openAddModal"
            >
              <span class="hidden sm:inline">Tambah Majelis</span>
            </UButton>
          </div>
        </div>
      </div>
    </SharedHeaderBg>

    <div
      class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <UTable
        :data="dataMajelis"
        :columns="columnsMajelisTable"
        :loading="loading"
      >
        <template #name-cell="{ row }">
          <div class="font-bold text-gray-900">{{ row.original.name }}</div>
          <UBadge
            v-if="row.original.is_majelis"
            color="primary"
            variant="soft"
            size="xs"
            class="mt-1"
          >
            Majelis Aktif
          </UBadge>
        </template>

        <template #phone-cell="{ row }">
          <div class="text-gray-700">{{ row.original.phone || '-' }}</div>
        </template>

        <template #username-cell="{ row }">
          <div class="text-gray-600">{{ row.original.username || '-' }}</div>
        </template>

        <template #action-cell="{ row }">
          <UTooltip text="Hapus Majelis">
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="sm"
              @click="confirmDelete(row.original.id)"
            />
          </UTooltip>
        </template>
      </UTable>
    </div>

    <!-- Modal Tambah Majelis -->
    <UModal v-model:open="isOpen" :ui="{ content: 'max-w-md' }">
      <template #header>
        <div class="flex items-center gap-2 font-bold text-gray-900">
          <UIcon name="i-lucide-user-plus" class="text-primary-600 w-5 h-5" />
          <span>Tambah Data Majelis</span>
        </div>
      </template>

      <template #body>
        <UForm
          :schema="MajelisFormSchema"
          :state="form"
          class="space-y-6"
          @submit="saveData"
        >
          <UFormField name="person" label="Pilih Kepala Keluarga / Warga">
            <!-- Asumsi dropdownFamilyHead menghasilkan array format { key: '...', label: '...' } -->
            <USelectMenu
              v-model="form.person"
              :items="dropdownFamilyHead"
              value-key="key"
              label-key="label"
              placeholder="Cari dan pilih warga..."
              size="lg"
              class="w-full"
            />
          </UFormField>

          <div
            class="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4"
          >
            <UButton variant="ghost" label="Batal" @click="isOpen = false" />
            <UButton
              type="submit"
              color="neutral"
              label="Simpan Data"
              :loading="loading"
            />
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Pagination -->
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
        @update:page="getData"
      />
    </div>
  </div>
</template>
