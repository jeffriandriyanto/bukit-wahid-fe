import { watchWithFilter, debounceFilter } from '@vueuse/core'

const columnsPayment = [
  { accessorKey: 'person', header: 'Nama Warga' },
  { accessorKey: 'amount', header: 'Nominal' },
  { accessorKey: 'va', header: 'VA' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'created_at', header: 'Tanggal' },
  { accessorKey: 'proof', header: 'Bukti' },
  { id: 'action', header: 'Aksi', class: 'text-right' }
]

type BadgeColor = 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'

const statusMap: Record<string, { label: string; color: BadgeColor }> = {
  unpaid: { label: 'Belum Bayar', color: 'warning' },
  approve: { label: 'Diterima', color: 'success' },
  unvalid: { label: 'Tidak Valid', color: 'error' },
  pending: { label: 'Menunggu', color: 'neutral' }
}

export const usePayment = () => {
  const { reveal: confirm } = useConfirmService()
  const toast = useToast()
  const { dropdownPaymentAction, getDropdownPaymentAction } = useApiDropdown()

  // --- Data & Pagination ---
  const dataPayment = ref<any[]>([])
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  })

  // --- Search & Filter ---
  const search = ref('')
  const selectedStatus = ref<string | null>(null)

  // --- Loading ---
  const loading = ref(false)
  const loadingDetail = ref(false)
  const submitting = ref(false)

  // --- Review Modal ---
  const isOpen = ref(false)
  const detail = ref<any>(null)
  const reviewStatus = ref<string | null>(null)

  const statusInfo = (status: string | null) =>
    statusMap[status || ''] || { label: status || '-', color: 'neutral' }

  // --- Actions ---
  const getData = async () => {
    loading.value = true
    try {
      const res = await useApi('/finance/payment/get', {
        params: {
          search: search.value,
          status: selectedStatus.value,
          page: pagination.value.current_page,
          limit: pagination.value.per_page
        },
        method: 'GET'
      })

      if (res.status === 1) {
        dataPayment.value = res.data
        if (res.pagination) { pagination.value = { ...res.pagination } }
      }
    } catch {
      // handled by global error handler
    } finally {
      loading.value = false
    }
  }

  const openReview = async (row: any) => {
    reviewStatus.value = null
    isOpen.value = true
    loadingDetail.value = true
    try {
      const res = await useApi(`/finance/payment/show/${row.id}`)
      if (res.status === 1) {
        detail.value = res.data
      }
    } catch {
      toast.add({ title: 'Gagal mengambil detail pembayaran', color: 'error' })
    } finally {
      loadingDetail.value = false
    }
  }

  const submitReview = async () => {
    if (!detail.value || !reviewStatus.value) return

    const ok = await confirm({
      title: 'Review Pembayaran',
      description: `Anda akan menyetujui pembayaran ini dengan status "${statusInfo(reviewStatus.value).label}".`,
      confirmLabel: 'Ya, Lanjutkan',
      cancelLabel: 'Batal',
      color: 'primary'
    })

    if (!ok) return

    submitting.value = true
    try {
      const res = await useApi(`/finance/payment/review/${detail.value.id}`, {
        method: 'POST',
        body: { status: reviewStatus.value }
      })

      if (res.status === 1) {
        toast.add({ title: 'Pembayaran berhasil direview', color: 'success' })
        isOpen.value = false
        getData()
      }
    } catch (err: any) {
      toast.add({ title: err?.message || 'Gagal mereview pembayaran', color: 'error' })
    } finally {
      submitting.value = false
    }
  }

  watchWithFilter(
    search,
    () => {
      pagination.value.current_page = 1
      getData()
    },
    { eventFilter: debounceFilter(1000) }
  )

  watch(
    () => pagination.value.per_page,
    () => {
      pagination.value.current_page = 1
      getData()
    }
  )

  onMounted(() => {
    getDropdownPaymentAction()
    getData()
  })

  return {
    columnsPayment,
    dropdownPaymentAction,
    dataPayment,
    pagination,
    search,
    selectedStatus,
    loading,
    loadingDetail,
    submitting,
    isOpen,
    detail,
    reviewStatus,
    statusInfo,
    getData,
    openReview,
    submitReview
  }
}
