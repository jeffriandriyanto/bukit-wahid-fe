import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { genderItems, religionOptions } from '~/const/dropdown'
import { fileUpload } from '~/services/files'

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

export const useCitizenForm = (getData: () => Promise<void>) => {
  const { reveal: confirm } = useConfirmService()
  const toast = useToast()

  // --- Modal State ---
  const isOpen = ref(false)
  const mode = ref<'add' | 'edit'>('add')
  const editingId = ref<string | null>(null)
  const loading = ref(false)
  const loadingEdit = ref(false)
  const isOpenPassword = ref(false)
  const passwordTargetId = ref<string | null>(null)

  // --- File Upload ---
  const avatarFile = ref<File | null>(null)
  const signatureFile = ref<File | null>(null)

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

  // --- Watchers ---
  watch(avatarFile, (file) => {
    if (file) {
      if (form.avatar?.startsWith('blob:')) URL.revokeObjectURL(form.avatar)
      form.avatar = URL.createObjectURL(file)
    }
  })

  return {
    // Schema
    CitizenFormSchema,
    PasswordSchema,
    // Constants
    genderItems,
    religionOptions,
    // Modal State
    isOpen,
    mode,
    loading,
    loadingEdit,
    isOpenPassword,
    // File Upload
    avatarFile,
    signatureFile,
    // Form
    form,
    passwordForm,
    // Helpers
    getAge,
    clearFile,
    // Actions
    openAddModal,
    openEditModal,
    saveData,
    confirmDelete,
    openPasswordModal,
    handleUpdatePassword
  }
}
