<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { perPageLimit } from '~/const/utils'

definePageMeta({ middleware: ['auth'] })

const { reveal: confirm } = useConfirmService()
const toast = useToast()

const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingId = ref<number | null>(null)
const loading = ref(false)

interface CoaItem {
  tag: number
  name: string
  category: string
  pos: string
  normal_balance: string
  is_default: boolean
}

const categoryOptions = [
  { label: 'Kas', value: 'Kas', pos: 'NRC', normal_balance: 'db' },
  { label: 'Bank', value: 'Bank', pos: 'NRC', normal_balance: 'db' },
  { label: 'Piutang', value: 'Piutang', pos: 'NRC', normal_balance: 'db' },
  { label: 'Persediaan', value: 'Persediaan', pos: 'NRC', normal_balance: 'db' },
  { label: 'Aktiva Tetap', value: 'Aktiva Tetap', pos: 'NRC', normal_balance: 'db' },
  { label: 'Aktiva Lancar Lainnya', value: 'Aktiva Lancar Lainnya', pos: 'NRC', normal_balance: 'db' },
  { label: 'Akumulasi Penyusutan', value: 'Akumulasi Penyusutan', pos: 'NRC', normal_balance: 'kr' },
  { label: 'Hutang', value: 'Hutang', pos: 'NRC', normal_balance: 'kr' },
  { label: 'Hutang Jangka Panjang', value: 'Hutang Jangka Panjang', pos: 'NRC', normal_balance: 'kr' },
  { label: 'Hutang Lancar Lainnya', value: 'Hutang Lancar Lainnya', pos: 'NRC', normal_balance: 'kr' },
  { label: 'Modal', value: 'Modal', pos: 'NRC', normal_balance: 'kr' },
  { label: 'Pendapatan', value: 'Pendapatan', pos: 'LR', normal_balance: 'kr' },
  { label: 'Biaya Overhead', value: 'Biaya Overhead', pos: 'LR', normal_balance: 'db' },
  { label: 'Biaya Operasional', value: 'Biaya Operasional', pos: 'LR', normal_balance: 'db' },
]

const posOptions = [
  { label: 'Neraca (NRC)', value: 'NRC' },
  { label: 'Laba Rugi (LR)', value: 'LR' },
]

const normalBalanceOptions = [
  { label: 'Debet (Db)', value: 'db' },
  { label: 'Kredit (Kr)', value: 'kr' },
]

const CoaFormSchema = z.object({
  tag: z
    .number({
      error: (issue) => {
        if (issue.input === undefined) return 'Tag wajib diisi'
        return 'Tag harus berupa angka'
      }
    })
    .min(1, { error: 'Tag minimal bernilai 1' }),
  name: z.string().min(1, 'Nama akun wajib diisi'),
  category: z.string().min(1, 'Kategori wajib dipilih'),
  pos: z.string().min(1, 'Pos laporan wajib dipilih'),
  normal_balance: z.string().min(1, 'Saldo normal wajib dipilih'),
})

const dataCoa = ref<CoaItem[]>([])
const search = ref('')
const selectedCategory = ref<string>('all')
const selectedPos = ref<string>('all')

const filterCategoryOptions = [
  { label: 'Semua Kategori', value: 'all' },
  ...categoryOptions
]

const filterPosOptions = [
  { label: 'Semua Pos', value: 'all' },
  ...posOptions
]

const columnsCoaTable = [
  { accessorKey: 'tag', header: 'Kode Akun' },
  { accessorKey: 'name', header: 'Nama Akun' },
  { accessorKey: 'category', header: 'Klasifikasi / Kategori' },
  { accessorKey: 'pos', header: 'Pos Laporan' },
  { accessorKey: 'normal_balance', header: 'Saldo Normal' },
  { accessorKey: 'is_default', header: 'Status' },
  { accessorKey: 'action', header: 'Aksi' }
]

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0
})

/* =========================
  FORM STATE
========================= */
interface CoaForm {
  tag: number | undefined
  name: string
  category: string
  pos: string
  normal_balance: string
}

const form = reactive<CoaForm>({
  tag: undefined,
  name: '',
  category: 'Biaya Overhead',
  pos: 'LR',
  normal_balance: 'db',
})

const onCategoryChange = (val: string) => {
  const match = categoryOptions.find((c) => c.value === val)
  if (match) {
    form.pos = match.pos
    form.normal_balance = match.normal_balance
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
  editingId.value = row.tag

  Object.assign(form, {
    tag: row.tag,
    name: row.name,
    category: row.category || 'Biaya Overhead',
    pos: row.pos || 'LR',
    normal_balance: row.normal_balance || 'db',
  })
  isOpen.value = true
}

const confirmDelete = async (row: any) => {
  const ok = await confirm({
    title: 'Hapus Data COA?',
    description: `Apakah Anda yakin ingin menghapus akun "${row.name}" (Tag: ${row.tag})?`,
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  try {
    loading.value = true
    const res = await useApi(`/finance/coa/${row.tag}`, {
      method: 'DELETE'
    })
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
  form.tag = undefined
  form.name = ''
  form.category = 'Biaya Overhead'
  form.pos = 'LR'
  form.normal_balance = 'db'
  editingId.value = null
}

const getData = async () => {
  loading.value = true
  try {
    const res: any = await useApi('/finance/coa', {
      params: {
        page: pagination.value.current_page,
        limit: pagination.value.per_page,
        search: search.value || undefined,
        category: selectedCategory.value !== 'all' ? selectedCategory.value : undefined,
        pos: selectedPos.value !== 'all' ? selectedPos.value : undefined,
      },
      method: 'GET'
    })

    if (res && (res.status === 1 || res.status === true)) {
      if (Array.isArray(res.data)) {
        dataCoa.value = res.data
      } else if (res.data && Array.isArray(res.data.data)) {
        dataCoa.value = res.data.data
      } else {
        dataCoa.value = []
      }

      if (res.pagination) {
        pagination.value.total = res.pagination.total ?? 0
        pagination.value.last_page = res.pagination.last_page ?? 1
        pagination.value.current_page = res.pagination.current_page ?? 1
      }
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

const saveData = async (event: FormSubmitEvent<CoaFormSchema>) => {
  try {
    loading.value = true

    const payload = {
      tag: event.data.tag,
      name: event.data.name,
      category: event.data.category,
      pos: event.data.pos,
      normal_balance: event.data.normal_balance,
    }

    const res: any = await useApi('/finance/coa', {
      method: 'POST',
      body: payload
    })

    if (res && res.status === 1) {
      toast.add({
        title: `Berhasil ${mode.value === 'add' ? 'menambah' : 'mengubah'} data akun`,
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
}

// Debounced search
let searchTimer: any = null
const onSearchChange = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pagination.value.current_page = 1
    getData()
  }, 300)
}

const onPerPageChange = () => {
  pagination.value.current_page = 1
  getData()
}

const onFilterChange = () => {
  pagination.value.current_page = 1
  getData()
}

onMounted(() => {
  getData()
})
</script>

<template>
  <div class="space-y-4">
    <ConfirmDialog />

    <SharedHeaderBg>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary-50 rounded-lg">
          <UIcon
            name="i-lucide-receipt-text"
            class="w-5 h-5 text-primary-600"
          />
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-900">
            Chart of Accounts (COA)
          </h2>
          <p class="text-xs text-gray-500">
            Kelola daftar akun, klasifikasi Overhead vs Operasional, Pos Laporan, dan Saldo Normal
          </p>
        </div>
      </div>

      <UButton
        color="neutral"
        trailing-icon="mdi-plus-circle-outline"
        @click="openAddModal"
      >
        Tambah Akun
      </UButton>
    </SharedHeaderBg>

    <!-- Filter & Search Toolbar -->
    <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
      <div class="w-full md:w-72">
        <UInput
          v-model="search"
          placeholder="Cari kode atau nama akun..."
          icon="i-lucide-search"
          @input="onSearchChange"
        />
      </div>

      <div class="flex items-center gap-2 w-full md:w-auto">
        <USelect
          v-model="selectedCategory"
          :items="filterCategoryOptions"
          value-attribute="value"
          option-attribute="label"
          class="w-48"
          @update:model-value="onFilterChange"
        />

        <USelect
          v-model="selectedPos"
          :items="filterPosOptions"
          value-attribute="value"
          option-attribute="label"
          class="w-40"
          @update:model-value="onFilterChange"
        />
      </div>
    </div>

    <!-- Modal Form -->
    <UModal v-model:open="isOpen">
      <template #header>
        <span class="font-bold">
          {{ mode === 'add' ? 'Tambah' : 'Edit' }} Akun COA
        </span>
      </template>

      <template #body>
        <UForm
          :schema="CoaFormSchema"
          :state="form"
          class="w-full space-y-4"
          @submit="saveData"
        >
          <UFormField name="tag" label="Kode Tag / Nomor Akun" required>
            <UInput
              v-model.number="form.tag"
              type="number"
              placeholder="Contoh: 6001"
              :disabled="mode === 'edit'"
            />
          </UFormField>

          <UFormField name="name" label="Nama Akun" required>
            <UInput
              v-model="form.name"
              placeholder="Contoh: Gaji Security"
            />
          </UFormField>

          <UFormField name="category" label="Klasifikasi / Kategori Akun" required>
            <USelect
              v-model="form.category"
              :items="categoryOptions"
              value-attribute="value"
              option-attribute="label"
              class="w-full"
              @update:model-value="onCategoryChange"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-3">
            <UFormField name="pos" label="Pos Laporan" required>
              <USelect
                v-model="form.pos"
                :items="posOptions"
                value-attribute="value"
                option-attribute="label"
                class="w-full"
              />
            </UFormField>

            <UFormField name="normal_balance" label="Saldo Normal" required>
              <USelect
                v-model="form.normal_balance"
                :items="normalBalanceOptions"
                value-attribute="value"
                option-attribute="label"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="flex w-full items-center justify-between gap-2 pt-4">
            <UButton variant="ghost" @click="isOpen = false"> Batal </UButton>

            <UButton type="submit" color="neutral" :loading="loading">
              Simpan
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Table COA -->
    <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <UTable :data="dataCoa" :columns="columnsCoaTable" :loading="loading" class="flex-1">
        <template #tag-cell="{ row }">
          <span class="font-mono font-bold text-gray-800">{{ row.original?.tag }}</span>
        </template>

        <template #name-cell="{ row }">
          <span class="font-medium text-gray-900">{{ row.original?.name }}</span>
        </template>

        <template #category-cell="{ row }">
          <UBadge
            v-if="row.original?.category === 'Biaya Overhead'"
            variant="subtle"
            color="warning"
            size="sm"
          >
            Overhead
          </UBadge>
          <UBadge
            v-else-if="row.original?.category === 'Biaya Operasional'"
            variant="subtle"
            color="error"
            size="sm"
          >
            Operasional
          </UBadge>
          <UBadge
            v-else-if="row.original?.category === 'Pendapatan'"
            variant="subtle"
            color="success"
            size="sm"
          >
            Pendapatan
          </UBadge>
          <UBadge
            v-else-if="row.original?.category === 'Kas' || row.original?.category === 'Bank'"
            variant="subtle"
            color="primary"
            size="sm"
          >
            {{ row.original?.category }}
          </UBadge>
          <span v-else class="text-xs text-gray-600 font-medium">
            {{ row.original?.category || '-' }}
          </span>
        </template>

        <template #pos-cell="{ row }">
          <span
            class="text-xs font-semibold px-2 py-0.5 rounded"
            :class="row.original?.pos === 'LR' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'"
          >
            {{ row.original?.pos === 'LR' ? 'Laba Rugi' : 'Neraca' }}
          </span>
        </template>

        <template #normal_balance-cell="{ row }">
          <span class="font-mono text-xs font-medium uppercase" :class="row.original?.normal_balance === 'db' ? 'text-emerald-600' : 'text-purple-600'">
            {{ row.original?.normal_balance === 'db' ? 'Debet' : 'Kredit' }}
          </span>
        </template>

        <template #is_default-cell="{ row }">
          <UBadge
            v-if="row.original?.is_default"
            variant="subtle"
            color="neutral"
            size="sm"
          >
            Sistem
          </UBadge>
          <span v-else class="text-gray-400 text-xs">-</span>
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
              v-if="!row.original?.is_default"
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
          @update:model-value="onPerPageChange"
        />
        <span class="text-xs text-gray-500">dari {{ pagination.total }} akun</span>
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
