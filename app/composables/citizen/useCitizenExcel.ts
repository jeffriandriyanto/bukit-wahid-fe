import { fileUploadResidence } from '~/services/files'

export const useCitizenExcel = (getData: () => Promise<void>) => {
  const toast = useToast()

  const excelInput = ref<HTMLInputElement | null>(null)
  const loadingExcel = ref(false)

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

  return {
    excelInput,
    loadingExcel,
    excelActions,
    handleExcelChange
  }
}
