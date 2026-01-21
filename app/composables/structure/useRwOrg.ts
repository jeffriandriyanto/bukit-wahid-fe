import type { OrgNode, BEWrapper } from "~/types/org"

export const useRwStructure = () => {
  const rwData = ref<OrgNode | null>(null)
  const toast = useToast()

  const fetchRw = async () => {
    try {
      const res = await useApi<BEWrapper>('/position/get/rw')
      if (res.status === 1 && res.data) {
        rwData.value = buildOrgTree(res.data)
      }
    } catch (e: any) {
      toast.add({ title: e?.message || 'Gagal load RW', color: 'error' })
    }
  }

  return { rwData, fetchRw }
}
