<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { perPageLimit } from '~/const/utils'

const { reveal: confirm } = useConfirmService()
const toast = useToast()

const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingId = ref<number | null>(null)
const loading = ref(false)

interface CoaItem {
  tag: number
  name: string
  is_default: boolean
}

// Schema Zod disesuaikan dengan COA
const CoaFormSchema = z.object({
  tag: z
    .number({
      error: (issue) => {
        if (issue.input === undefined) return 'Tag wajib diisi'
        return 'Tag harus berupa angka'
      }
    })
    .min(1, { error: 'Tag minimal bernilai 1' }),
  name: z.string().min(1, 'Nama wajib diisi')
})

type CoaFormSchema = z.infer<typeof CoaFormSchema>

const dataCoa = ref<CoaItem[]>([])

const columnsCoaTable = [
  {
    accessorKey: 'tag',
    header: 'Tag / Kode'
  },
  {
    accessorKey: 'name',
    header: 'Nama Akun'
  },
  {
    accessorKey: 'is_default',
    header: 'Default'
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
interface CoaForm {
  tag: number | undefined
  name: string
}

const form = reactive<CoaForm>({
  tag: undefined,
  name: ''
})

const openAddModal = () => {
  resetForm()
  mode.value = 'add'
  isOpen.value = true
}

const openEditModal = async (row: any) => {
  resetForm()
  mode.value = 'edit'
  editingId.value = row.tag

  // Mengisi form dengan data yang ada
  Object.assign(form, {
    tag: row.tag,
    name: row.name
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
    // Menggunakan tag sebagai parameter delete sesuai instruksi
    const res = await useApi<any>(`/finance/coa/${row.tag}`, {
      method: 'DELETE'
    })
    if (res.status === 1) {
      toast.add({ title: 'Data berhasil dihapus', color: 'success' })
      getData() // Refresh data
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
  editingId.value = null
}

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/finance/coa', {
      params: {
        page: pagination.value.current_page,
        limit: pagination.value.per_page
      },
      method: 'GET'
    })

    if (res.status === 1) {
      dataCoa.value = res.data
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

const saveData = async (event: FormSubmitEvent<CoaFormSchema>) => {
  try {
    loading.value = true

    const payload = {
      tag: event.data.tag,
      name: event.data.name
    }

    // Berdasarkan instruksi: POST ke /finance/coa untuk add & edit
    const res = await useApi<any>('/finance/coa', {
      method: 'POST',
      body: payload
    })

    if (res.status === 1) {
      toast.add({
        title: `Berhasil ${mode.value === 'add' ? 'menambah' : 'mengubah'} data`,
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

watch(
  () => pagination.value.per_page,
  () => {
    pagination.value.current_page = 1
    getData()
  }
)

onMounted(getData)

definePageMeta({
  middleware: ['auth']
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
        <h2 class="text-lg font-bold text-gray-900">
          Manajemen Kode Akun (COA)
        </h2>
      </div>

      <UButton
        color="neutral"
        trailing-icon="mdi-plus-circle-outline"
        @click="openAddModal"
      >
        Tambah Akun (COA)
      </UButton>
    </SharedHeaderBg>

    <UModal v-model:open="isOpen">
      <template #header>
        <span class="font-bold"
          >{{ mode === 'add' ? 'Tambah' : 'Edit' }} Akun</span
        >
      </template>

      <template #body>
        <UForm
          :schema="CoaFormSchema"
          :state="form"
          class="w-full space-y-6"
          @submit="saveData"
        >
          <UFormField name="tag" label="Kode Tag" required>
            <UInput
              v-model.number="form.tag"
              type="number"
              placeholder="Contoh: 1100"
              :disabled="mode === 'edit'"
            />
          </UFormField>

          <UFormField name="name" label="Nama Akun" required>
            <UInput
              v-model="form.name"
              placeholder="Nama Akun (e.g. Bank Mandiri)"
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

    <div
      class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <UTable :data="dataCoa" :columns="columnsCoaTable" class="flex-1">
        <template #is_default-cell="{ row }">
          <UBadge
            v-if="row.original.is_default"
            variant="subtle"
            color="success"
            size="sm"
          >
            Default
          </UBadge>
          <span v-else class="text-gray-400 text-sm">-</span>
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
  </div>
</template>
