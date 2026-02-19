import type { OrgNode, BEWrapper } from '~/types/org'

export const useRtStructure = () => {
  const rtData = ref<OrgNode | null>(null)
  const rtOrgData = ref<any>(null)
  const selectedRT = ref<string | number | null>(null)
  const toast = useToast()
  const { reveal: confirm } = useConfirmService()

  const fetchRt = async () => {
    if (!selectedRT.value) return
    try {
      const res = await useApi<BEWrapper>(
        `/position/get/rt/${selectedRT.value}`
      )
      rtData.value =
        res.status === 1 && res.data ? buildOrgTree(res.data) : null
    } catch (e: any) {
      rtData.value = null
      toast.add({ title: e.message || 'Gagal load RT', color: 'error' })
    }
  }

  const fetchRtOrg = async () => {
    try {
      const res = await useApi<BEWrapper>(`/organization`)
      rtOrgData.value = res.data
    } catch (e: any) {
      rtOrgData.value = null
      toast.add({ title: e.message || 'Gagal load Organisasi', color: 'error' })
    }
  }

  watch(selectedRT, () => fetchRt())

  const addRT = async (value: string) => {
    const store = useApiDropdown()
    try {
      const response = await useApi<BEWrapper>('/organization', {
        method: 'POST',
        body: {
          name: value
        }
      })

      if (response.status === 1) {
        store.dropdownRT.value.push({
          key: value,
          label: value
        })
        fetchRtOrg()
      }
    } catch (error) {
      console.error('Error fetching RW data:', error)
      toast.add({
        description: 'Terjadi kesalahan saat mengambil data dari server.',
        color: 'error'
      })
    }
  }

  const editRT = async (value: string, idRT: string) => {
    try {
      const response = await useApi<BEWrapper>('/organization/' + idRT, {
        method: 'POST',
        body: {
          name: value
        }
      })

      if (response.status === 1) {
        fetchRt()
        fetchRtOrg()
      }
    } catch (error) {
      console.error('Error fetching RW data:', error)
      toast.add({
        description: 'Terjadi kesalahan saat mengambil data dari server.',
        color: 'error'
      })
    }
  }

  const deleteRT = async (idRT: string) => {
    try {
      const response = await useApi<BEWrapper>(`/organization/${idRT}`, {
        method: 'DELETE'
      })

      if (response.status === 1) {
        toast.add({ title: 'Berhasil menghapus data', color: 'success' })
        fetchRt()
        fetchRtOrg()
      }
    } catch (err: any) {
      toast.add({
        title: 'Gagal menghapus struktur',
        description: err?.message || 'Terjadi kesalahan sistem',
        color: 'error'
      })
    }
  }

  return {
    rtData,
    rtOrgData,
    selectedRT,
    fetchRtOrg,
    fetchRt,
    addRT,
    editRT,
    deleteRT
  }
}
