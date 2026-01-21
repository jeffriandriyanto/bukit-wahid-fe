import type { OrgNode, BEWrapper } from "~/types/org"

export const useRtStructure = () => {
  const rtData = ref<OrgNode | null>(null)
  const selectedRT = ref<string | number | null>(null)
  const toast = useToast()

  const fetchRt = async () => {
    if (!selectedRT.value) return
    try {
      const res = await useApi<BEWrapper>(`/position/get/rt/${selectedRT.value}`)
      rtData.value = (res.status === 1 && res.data) ? buildOrgTree(res.data) : null
    } catch (e: any) {
      rtData.value = null
      toast.add({ title: e.message || 'Gagal load RT', color: 'error' })
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
          lable: value
        })
      }
    } catch (error) {
      console.error('Error fetching RW data:', error)
      toast.add({
        description: 'Terjadi kesalahan saat mengambil data dari server.',
        color: 'error'
      })
    }
  }

  return { rtData, selectedRT, fetchRt, addRT }
}
