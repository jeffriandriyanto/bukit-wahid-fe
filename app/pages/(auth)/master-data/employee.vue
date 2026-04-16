<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { watchWithFilter, debounceFilter } from '@vueuse/core'
import { perPageLimit } from '~/const/utils'

definePageMeta({ middleware: ['auth'] })

// ===== 1. SCHEMA & VALIDASI =====
const EmployeeSchema = z.object({
  name: z.string().min(1, 'Nama karyawan wajib diisi'),
  phone: z
    .string()
    .min(10, 'Nomor telepon minimal 10 digit')
    .max(15, 'Nomor telepon terlalu panjang'),
  category: z.string().min(1, 'Kategori wajib dipilih')
})

type EmployeeSchema = z.infer<typeof EmployeeSchema>

// ===== 2. STATE =====
const { reveal: confirm } = useConfirmService()
const toast = useToast()

const dataEmployee = ref<any[]>([])
const categoryOptions = ref<any[]>([])
const loading = ref(false)
const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingId = ref<string | null>(null)

// Filters
const search = ref('')
const selectedCategory = ref(null)

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

const form = reactive({
  name: '',
  phone: '',
  category: ''
})

// ===== 3. ACTIONS =====

const getOptions = async () => {
  try {
    const res = await useApi<any>('/dropdown/employee-category')
    if (res.status === 1) {
      // Kita simpan di state agar bisa dipakai Filter & Modal
      categoryOptions.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch categories:', err)
  }
}

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/employee', {
      params: {
        search: search.value,
        category: selectedCategory.value, // Tambahan filter category
        page: pagination.value.current_page,
        limit: pagination.value.per_page
      }
    })
    if (res.status === 1) {
      dataEmployee.value = res.data
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

const openEditModal = (row: any) => {
  resetForm()
  mode.value = 'edit'
  editingId.value = row.id

  Object.assign(form, {
    name: row.name,
    phone: row.phone,
    category: row.category
  })
  isOpen.value = true
}

const resetForm = () => {
  editingId.value = null
  Object.assign(form, {
    name: '',
    phone: '',
    category: ''
  })
}

const saveData = async (event: FormSubmitEvent<EmployeeSchema>) => {
  loading.value = true
  try {
    const url =
      mode.value === 'add' ? '/employee' : `/employee/${editingId.value}`
    const method = mode.value === 'add' ? 'POST' : 'PUT'

    const res = await useApi<any>(url, { method, body: event.data })

    if (res.status === 1) {
      toast.add({
        title: `Berhasil ${
          mode.value === 'add' ? 'menambah' : 'mengubah'
        } petugas`,
        color: 'success'
      })
      isOpen.value = false
      getData()
    }
  } catch (err: any) {
    toast.add({
      title: err?.data?.message || 'Terjadi kesalahan server',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const confirmDelete = async (row: any) => {
  const ok = await confirm({
    title: 'Hapus Petugas?',
    description: `Apakah Anda yakin ingin menghapus "${row.name}"?`,
    confirmLabel: 'Hapus Sekarang',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  try {
    loading.value = true
    const res = await useApi<any>(`/employee/${row.id}`, { method: 'DELETE' })
    if (res.status === 1) {
      toast.add({ title: 'Data berhasil dihapus', color: 'success' })
      getData()
    }
  } catch (err: any) {
    toast.add({
      title: err?.data?.message || 'Gagal menghapus data',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// ===== 4. HELPERS & WATCHERS =====
const columns = [
  { accessorKey: 'name', header: 'Informasi Petugas' },
  { accessorKey: 'phone', header: 'WhatsApp' },
  { accessorKey: 'username', header: 'ID / Username' },
  { accessorKey: 'category', header: 'Jabatan/Kategori' },
  { id: 'action', header: 'Aksi' }
]

const getCategoryLabel = (key: string) => {
  return categoryOptions.value.find((opt) => opt.key === key)?.label || key
}

// Watchers
watchWithFilter(
  search,
  () => {
    pagination.value.current_page = 1
    getData()
  },
  { eventFilter: debounceFilter(1000) }
)

watch(selectedCategory, () => {
  pagination.value.current_page = 1
  getData()
})

watch(
  () => pagination.value.per_page,
  () => {
    pagination.value.current_page = 1
    getData()
  }
)

onMounted(() => {
  getOptions()
  getData()
})
</script>

<template>
  <div class="space-y-4">
    <ConfirmDialog />

    <SharedHeaderBg>
      <div
        class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 w-full py-2"
      >
        <div class="flex items-center gap-4 shrink-0">
          <div
            class="p-3 bg-primary-50 rounded-2xl border border-primary-100/50"
          >
            <UIcon
              name="i-lucide-user-check"
              class="w-6 h-6 text-primary-600 block"
            />
          </div>
          <h2 class="text-lg font-bold text-gray-900">Manajemen Petugas & Staf</h2>
        </div>

        <div class="flex items-center gap-3">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Cari nama..."
            size="lg"
            class="flex-1"
            :ui="{ root: 'rounded-full' }"
          />

          <div class="w-56 shrink-0">
            <USelectMenu
              v-model="selectedCategory"
              :items="categoryOptions"
              value-key="key"
              label-key="label"
              placeholder="Filter Jabatan"
              size="lg"
              class="rounded-full"
              clearable
            />
          </div>

          <UButton
            color="primary"
            icon="i-lucide-plus-circle"
            size="lg"
            class="rounded-full px-8 shadow-lg shadow-primary-500/20 font-bold"
            @click="openAddModal"
          >
            Tambah Petugas
          </UButton>
        </div>
      </div>
    </SharedHeaderBg>

    <div
      class="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm"
    >
      <UTable :data="dataEmployee" :columns="columns" :loading="loading">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100"
            >
              <UIcon name="i-lucide-user" class="text-slate-400 w-5 h-5" />
            </div>
            <div class="flex flex-col">
              <span class="font-bold text-slate-900 leading-tight">{{
                row.original.name
              }}</span>
            </div>
          </div>
        </template>

        <template #phone-cell="{ row }">
          <div
            class="flex items-center gap-2 text-sm text-slate-600 font-medium"
          >
            <UIcon
              name="i-lucide-phone"
              class="w-3.5 h-3.5 text-secondary-500"
            />
            {{ row.original.phone }}
          </div>
        </template>

        <template #username-cell="{ row }">
          <code
            class="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono text-primary-700 font-bold"
          >
            {{ row.original.username || '-' }}
          </code>
        </template>

        <template #category-cell="{ row }">
          <UBadge
            :color="row.original.category === 'security' ? 'secondary' : 'info'"
            variant="subtle"
            class="rounded-full px-4 uppercase text-[9px] font-black tracking-wider"
          >
            {{ getCategoryLabel(row.original.category) }}
          </UBadge>
        </template>

        <template #action-cell="{ row }">
          <div class="flex gap-1">
            <UButton
              icon="i-lucide-pencil"
              variant="ghost"
              color="neutral"
              size="sm"
              class="rounded-full"
              @click="openEditModal(row.original)"
            />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="sm"
              class="rounded-full"
              @click="confirmDelete(row.original)"
            />
          </div>
        </template>
      </UTable>
    </div>

    <div class="flex justify-between items-center px-4">
      <USelect
        v-model.number="pagination.per_page"
        :items="perPageLimit"
        value-attribute="value"
        option-attribute="label"
        class="w-24"
      />
      <UPagination
        v-model:page="pagination.current_page"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        @update:page="getData"
      />
    </div>

    <UModal
      v-model:open="isOpen"
      :ui="{ content: 'max-w-md', rounded: 'rounded-4xl' }"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <span class="font-black text-neutral-900 uppercase tracking-tight">
            {{ mode === 'add' ? 'Registrasi' : 'Edit' }} Petugas
          </span>
        </div>
      </template>

      <template #body>
        <UForm
          :schema="EmployeeSchema"
          :state="form"
          class="space-y-5"
          @submit="saveData"
        >
          <UFormField label="Nama Lengkap" name="name" required>
            <UInput
              v-model="form.name"
              placeholder="Nama lengkap petugas..."
              size="lg"
            />
          </UFormField>

          <UFormField label="No. WhatsApp" name="phone" required>
            <UInput v-model="form.phone" placeholder="0812..." size="lg" />
          </UFormField>

          <UFormField label="Jabatan / Kategori" name="category" required>
            <USelectMenu
              v-model="form.category"
              :items="categoryOptions"
              value-key="key"
              label-key="label"
              placeholder="Pilih Jabatan"
              size="lg"
            />
          </UFormField>

          <div class="flex justify-end gap-3 pt-6 border-t border-neutral-100">
            <UButton
              label="Batal"
              variant="ghost"
              color="neutral"
              class="font-bold"
              @click="isOpen = false"
            />
            <UButton
              type="submit"
              color="primary"
              label="Simpan"
              :loading="loading"
              class="px-8 font-black uppercase tracking-widest shadow-lg shadow-primary-100"
            />
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
