import type { ApiResponse } from '~/types/api'

export interface Option {
  key: string | null
  label: string
}

export const useApiDropdown = () => {
  const toast = useToast()

  const dropdownRT = ref<Option[]>([{ key: null, label: 'Semua RT' }])
  const dropdownAddress = ref<Option[]>([])
  const dropdownResidenceType = ref<Option[]>([])
  const dropdownResidenceKavling = ref<Option[]>([])
  const dropdownFamilyHead = ref<Option[]>([])
  const dropdownPosition = ref<Option[]>([])
  const dropdownPositionRW = ref<Option[]>([])

  const fetchDropdown = async (
    url: string,
    targetRef: Ref<Option[]>,
    label: string,
    init?: any
  ) => {
    try {
      const response = await useApi<ApiResponse<Option[]>>(url, {
        method: 'GET'
      })

      if (response.status === 1) {
        if (init) {
          targetRef.value = response.data || [...init]
        } else {
          targetRef.value = response.data || []
        }
      }
    } catch (error) {
      console.error(`Error fetching ${label}:`, error)
      toast.add({
        title: 'Gagal Memuat Data',
        description: `Terjadi kesalahan saat mengambil data ${label}.`,
        color: 'error'
      })
    }
  }

  // Actions
  const getDropdownRT = () =>
    fetchDropdown('/dropdown/rt', dropdownRT, 'Data RT', {
      key: null,
      label: 'Semua RT'
    })

  const getDropdownAddress = (idRT: string | number) =>
    fetchDropdown(`/dropdown/address/${idRT}`, dropdownAddress, 'Alamat')

  const getDropdownResidenceType = (idRT: string | number) =>
    fetchDropdown(
      `/dropdown/residance-type/${idRT}`,
      dropdownResidenceType,
      'Tipe Hunian'
    )

  const getDropdownResidenceKavling = (idRT: string | number) =>
    fetchDropdown(
      `/dropdown/residance-kavling/${idRT}`,
      dropdownResidenceKavling,
      'Kavling'
    )

  const getDropdownFamilyHead = () =>
    fetchDropdown(
      `/dropdown/familly-head`,
      dropdownFamilyHead,
      'Kepala Keluarga'
    )

  const getDropdownPosition = (idRT: string | number) =>
    fetchDropdown(`/dropdown/position/${idRT}`, dropdownPosition, 'Position')

  const getDropdownPositionRW = () =>
    fetchDropdown(`/dropdown/position`, dropdownPositionRW, 'Position')

  return {
    dropdownRT,
    dropdownAddress,
    dropdownResidenceType,
    dropdownResidenceKavling,
    dropdownFamilyHead,
    dropdownPosition,
    dropdownPositionRW,
    getDropdownRT,
    getDropdownAddress,
    getDropdownResidenceType,
    getDropdownResidenceKavling,
    getDropdownFamilyHead,
    getDropdownPosition,
    getDropdownPositionRW
  }
}
