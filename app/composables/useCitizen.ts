import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { genderItems, religionOptions } from '~/const/dropdown'
import { fileUpload, fileUploadResidence } from '~/services/files'
import { watchWithFilter, debounceFilter } from '@vueuse/core'
import { perPageLimit } from '~/const/utils'

export const CitizenFormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  phone: z.string().optional().nullable(),
  gender: z.enum(['L', 'P']),
  blood_type: z.string().optional().nullable(),
  dob: z.any().optional().nullable(),
  pob: z.string().optional().nullable(),
  nik: z.string().optional().nullable(),
  no_kk: z.string().optional().nullable(),
  email: z.string().email('Format email salah').optional().nullable(),
  avatar: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  job: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  marital_status: z.string().optional().nullable(),
  last_education: z.string().optional().nullable()
})

export type CitizenFormSchema = z.infer<typeof CitizenFormSchema>

const PasswordSchema = z.object({
  password: z.string().min(6, 'Password minimal 6 karakter')
})

type PasswordSchema = z.infer<typeof PasswordSchema>

const ageGroupOptions = [
  { key: null, label: 'Semua Usia' },
  { key: '0-3', label: '0 - 3 Tahun' },
  { key: '4-5', label: '4 - 5 Tahun' },
  { key: '6-12', label: '6 - 12 Tahun' },
  { key: '13-16', label: '13 - 16 Tahun' },
  { key: '17-21', label: '17 - 21 Tahun' },
  { key: '22-40', label: '22 - 40 Tahun' },
  { key: '41-59', label: '41 - 59 Tahun' },
  { key: '60', label: '>= 60 Tahun' }
]

const columnsFamilyTable = [
  { accessorKey: 'name', header: 'Informasi Warga' },
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'ttl', header: 'Tempat, Tgl Lahir' },
  { accessorKey: 'gender', header: 'L/P' },
  { accessorKey: 'blood_type', header: 'Gol. Darah', class: 'text-center' },
  { accessorKey: 'category', header: 'Kategori' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'action', header: 'Aksi', class: 'text-right' }
]

export const useCitizen = () => {
  const { reveal: confirm } = useConfirmService()
  const toast = useToast()
  const { dropdownRT, getDropdownRT } = useApiDropdown()

  // --- Modal State ---
  const isOpen = ref(false)
  const mode = ref<'add' | 'edit'>('add')
  const editingId = ref<string | null>(null)
  const loading = ref(false)
  const loadingEdit = ref(false)
  const isOpenPassword = ref(false)
  const passwordTargetId = ref<string | null>(null)
  const isFilterModalOpen = ref(false)

  // --- File Upload ---
  const avatarFile = ref<File | null>(null)
  const signatureFile = ref<File | null>(null)
  const excelInput = ref<HTMLInputElement | null>(null)
  const loadingExcel = ref(false)

  // --- Data & Pagination ---
  const dataCitizen = ref<any[]>([])
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  })

  // --- Search & Filter ---
  const search = ref('')
  const selectedRT = ref(null)
  const selectedAgeGroup = ref(null)
  const selectedReligion = ref(null)
  const tempRT = ref(null)
  const tempAgeGroup = ref(null)
  const tempReligion = ref(null)

  // --- Form ---
  const form = reactive<CitizenFormSchema>({
    name: '',
    phone: '',
    gender: 'L',
    blood_type: '',
    pob: '',
    dob: null,
    nik: '',
    no_kk: '',
    email: '',
    avatar: '',
    job: '',
    religion: '',
    nationality: '',
    marital_status: '',
    last_education: ''
  })

  const passwordForm = reactive({ password: '' })

  // --- Computed ---
  const activeFilterCount = computed(() => {
    let count = 0
    if (selectedRT.value) count++
    if (selectedAgeGroup.value) count++
    if (selectedReligion.value) count++
    return count
  })

  const excelActions = computed(() => [
    [
      {
        label: 'Download Template',
        icon: 'i-lucide-download-cloud',
        onSelect: () => downloadTemplateHandler()
      },
      {
        label: 'Upload Excel',
        icon: 'i-lucide-upload-cloud',
        onSelect: () => triggerExcelUpload()
      }
    ]
  ])

  // --- Helpers ---
  const getAge = (dob: string | null) => {
    if (!dob) return '-'
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const getStatusActive = (row: any) => !!row?.familly_member?.is_active

  const getCategory = (row: any) =>
    row?.familly_member?.familly?.category ?? row?.category ?? null

  const resetForm = () => {
    editingId.value = null
    avatarFile.value = null
    signatureFile.value = null
    Object.assign(form, {
      name: '',
      phone: '',
      gender: 'L',
      blood_type: '',
      pob: '',
      dob: null,
      nik: '',
      no_kk: '',
      email: '',
      avatar: '',
      job: '',
      religion: '',
      nationality: '',
      marital_status: '',
      last_education: ''
    })
  }

  const clearFile = (type: 'avatar' | 'signature') => {
    if (type === 'avatar') {
      if (form.avatar?.startsWith('blob:')) URL.revokeObjectURL(form.avatar)
      form.avatar = ''
      avatarFile.value = null
    }
  }

  // --- Data Actions ---
  const getData = async () => {
    loading.value = true
    try {
      const res = await useApi('/resident', {
        params: {
          search: search.value,
          rt: selectedRT.value,
          age_group: selectedAgeGroup.value,
          religion: selectedReligion.value,
          page: pagination.value.current_page,
          limit: pagination.value.per_page
        },
        method: 'GET'
      })

      if (res.status === 1) {
        dataCitizen.value = res.data
        if (res.pagination) { pagination.value = { ...res.pagination } }
      }
    } catch {
      // handled by global error handler
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
    loadingEdit.value = true
    resetForm()
    mode.value = 'edit'
    editingId.value = row.id

    try {
      const res = await useApi(`/resident/${row.id}`)
      if (res.status === 1) {
        Object.assign(form, { ...res.data, dob: parseToCalendarDate(row.dob) })
      }
    } catch {
      toast.add({ title: 'Gagal mengambil detail data', color: 'error' })
    } finally {
      isOpen.value = true
      loadingEdit.value = false
    }
  }

  const saveData = async (event: FormSubmitEvent<CitizenFormSchema>) => {
    try {
      loading.value = true
      let finalAvatarUrl = form.avatar

      if (avatarFile.value) {
        const uploadRes = await fileUpload(avatarFile.value)
        if (uploadRes) finalAvatarUrl = uploadRes
      }

      const payload = {
        ...event.data,
        dob: formatDOB(event.data.dob || ''),
        avatar: finalAvatarUrl
      }

      const url =
        mode.value === 'add' ? '/resident' : `/resident/${editingId.value}`
      const method = mode.value === 'add' ? 'POST' : 'PUT'

      const res = await useApi(url, { method, body: payload })

      if (res.status === 1) {
        toast.add({
          title: `Berhasil ${
            mode.value === 'add' ? 'menambah' : 'mengubah'
          } data`,
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
      title: 'Hapus Data Warga?',
      description: 'Data yang dihapus tidak dapat dikembalikan.',
      confirmLabel: 'Hapus',
      cancelLabel: 'Batal',
      color: 'error'
    })

    if (!ok) return

    try {
      loading.value = true
      const res = await useApi(`/resident/${id}`, { method: 'DELETE' })
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

  // --- Password Actions ---
  const openPasswordModal = (id: string) => {
    passwordTargetId.value = id
    passwordForm.password = ''
    isOpenPassword.value = true
  }

  const handleUpdatePassword = async (event: FormSubmitEvent<PasswordSchema>) => {
    const ok = await confirm({
      title: 'Ubah Password Warga?',
      description: 'Anda akan mengganti password akun warga ini secara paksa.',
      confirmLabel: 'Ya, Ubah',
      color: 'primary'
    })

    if (!ok) return

    try {
      loading.value = true
      const res = await useApi(
        `/resident/${passwordTargetId.value}/change-password`,
        {
          method: 'PUT',
          body: { password: event.data.password }
        }
      )

      if (res.status === 1) {
        toast.add({
          title: 'Password berhasil diperbarui',
          color: 'success'
        })
        isOpenPassword.value = false
      }
    } catch (err: any) {
      toast.add({
        title: err?.data?.message || 'Gagal mengubah password',
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  // --- Filter Actions ---
  const applyFilters = () => {
    selectedRT.value = tempRT.value
    selectedAgeGroup.value = tempAgeGroup.value
    selectedReligion.value = tempReligion.value

    pagination.value.current_page = 1
    getData()
    isFilterModalOpen.value = false
  }

  const resetFilters = () => {
    tempRT.value = null
    tempAgeGroup.value = null
    tempReligion.value = null

    selectedRT.value = null
    selectedAgeGroup.value = null
    selectedReligion.value = null

    search.value = ''
    pagination.value.current_page = 1
    getData()
    isFilterModalOpen.value = false
  }

  // --- Excel Actions ---
  const downloadTemplateHandler = () => {
    const config = useRuntimeConfig()
    const url = `${config.public.baseUrl}resident/excel/template`
    window.open(url, '_blank')
  }

  const triggerExcelUpload = () => excelInput.value?.click()

  const handleExcelChange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    try {
      loadingExcel.value = true
      const res = await fileUploadResidence(file)

      if (res?.status === 1) {
        toast.add({ title: 'Data berhasil diunggah', color: 'success' })
        getData()
      }
    } catch (err: any) {
      toast.add({
        title: err?.message || 'Gagal mengunggah data',
        color: 'error'
      })
    } finally {
      loadingExcel.value = false
      if (excelInput.value) excelInput.value.value = ''
    }
  }

  // --- Watchers ---
  watch(avatarFile, (file) => {
    if (file) {
      if (form.avatar?.startsWith('blob:')) URL.revokeObjectURL(form.avatar)
      form.avatar = URL.createObjectURL(file)
    }
  })

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
    getDropdownRT()
    getData()
  })

  return {
    // Schema
    CitizenFormSchema,
    PasswordSchema,
    // Constants
    columnsFamilyTable,
    ageGroupOptions,
    perPageLimit,
    genderItems,
    religionOptions,
    // Dropdown
    dropdownRT,
    // Modal State
    isOpen,
    mode,
    loading,
    loadingEdit,
    isOpenPassword,
    isFilterModalOpen,
    // File Upload
    avatarFile,
    signatureFile,
    excelInput,
    loadingExcel,
    // Data & Pagination
    dataCitizen,
    pagination,
    // Search & Filter
    search,
    selectedRT,
    selectedAgeGroup,
    selectedReligion,
    tempRT,
    tempAgeGroup,
    tempReligion,
    activeFilterCount,
    // Form
    form,
    passwordForm,
    // Helpers
    getAge,
    getStatusActive,
    getCategory,
    clearFile,
    // Data Actions
    getData,
    openAddModal,
    openEditModal,
    saveData,
    confirmDelete,
    // Password Actions
    openPasswordModal,
    handleUpdatePassword,
    // Filter Actions
    applyFilters,
    resetFilters,
    // Excel Actions
    excelActions,
    handleExcelChange
  }
}
