import type { FormSubmitEvent } from '@nuxt/ui'
import { perPageLimit } from '~/const/utils'

interface PaginationState {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

interface UseCrudTableOptions<TForm> {
  endpoint: string
  defaultForm: () => TForm
  idField?: string
  displayField?: string
  extraParams?: () => Record<string, any>
  transformPayload?: (data: TForm, mode: 'add' | 'edit') => any
  transformRowToForm?: (row: any) => TForm
  onAfterSave?: () => void
  onAfterDelete?: () => void
  confirmLabels?: {
    deleteTitle?: string
    deleteDescription?: (name: string) => string
    successAdd?: string
    successEdit?: string
    successDelete?: string
  }
}

export const useCrudTable = <TForm extends Record<string, any>>(options: UseCrudTableOptions<TForm>) => {
  const {
    endpoint,
    defaultForm,
    idField = 'id',
    displayField = 'title',
    extraParams,
    transformPayload,
    transformRowToForm,
    onAfterSave,
    onAfterDelete,
    confirmLabels = {}
  } = options

  const { reveal: confirm } = useConfirmService()
  const toast = useToast()

  const loading = ref(false)
  const data = ref<any[]>([])
  const pagination = ref<PaginationState>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  })
  const isOpen = ref(false)
  const mode = ref<'add' | 'edit'>('add')
  const editingId = ref<string | null>(null)
  const form = reactive<TForm>(defaultForm())

  const getData = async () => {
    loading.value = true
    try {
      const params: Record<string, any> = {
        page: pagination.value.current_page,
        limit: pagination.value.per_page,
        ...(extraParams ? extraParams() : {})
      }

      const res = await useApi(endpoint, { params, method: 'GET' })

      if (res.status === 1) {
        data.value = res.data
        if (res.pagination) {
          pagination.value = { ...res.pagination }
        }
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  const resetForm = () => {
    editingId.value = null
    Object.assign(form, defaultForm())
  }

  const openAddModal = () => {
    resetForm()
    mode.value = 'add'
    isOpen.value = true
  }

  const openEditModal = async (row: any) => {
    resetForm()
    mode.value = 'edit'
    editingId.value = row[idField]

    if (transformRowToForm) {
      Object.assign(form, transformRowToForm(row))
    } else {
      Object.assign(form, { ...row })
    }

    isOpen.value = true
  }

  const saveData = async (event: FormSubmitEvent<TForm>) => {
    try {
      loading.value = true

      const payload = transformPayload
        ? transformPayload(event.data, mode.value)
        : event.data

      const url =
        mode.value === 'add'
          ? endpoint
          : `${endpoint}/${editingId.value}`
      const method = mode.value === 'add' ? 'POST' : 'PUT'

      const res = await useApi(url, { method, body: payload })

      if (res.status === 1) {
        const addMsg = confirmLabels.successAdd || 'Berhasil menambah data'
        const editMsg = confirmLabels.successEdit || 'Berhasil mengubah data'

        toast.add({
          title: mode.value === 'add' ? addMsg : editMsg,
          color: 'success'
        })

        isOpen.value = false
        getData()
        onAfterSave?.()
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

  const confirmDelete = async (row: any) => {
    const name = row[displayField] || 'data ini'
    const ok = await confirm({
      title: confirmLabels.deleteTitle || 'Hapus Data?',
      description:
        confirmLabels.deleteDescription?.(name) ||
        `Apakah Anda yakin ingin menghapus "${name}"?`,
      confirmLabel: 'Hapus',
      cancelLabel: 'Batal',
      color: 'error'
    })

    if (!ok) return

    try {
      loading.value = true
      const res = await useApi(`${endpoint}/${row[idField]}`, {
        method: 'DELETE'
      })

      if (res.status === 1) {
        toast.add({
          title: confirmLabels.successDelete || 'Data berhasil dihapus',
          color: 'success'
        })
        getData()
        onAfterDelete?.()
      }
    } catch (err: any) {
      toast.add({
        title: err?.message || 'Gagal menghapus data',
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

  return {
    loading,
    data,
    pagination,
    isOpen,
    mode,
    editingId,
    form,
    perPageLimit,
    getData,
    resetForm,
    openAddModal,
    openEditModal,
    saveData,
    confirmDelete
  }
}
