import type { ApiResponse } from "~/types/api";

interface Option {
  key: string;
  label: string;
}

export const useApiDropdown = () => {
  const toast = useToast();

  const dropdownRT = ref<Option[]>([]);
  const dropdownAddress = ref<Option[]>([]);
  const dropdownResidenceType = ref<Option[]>([]);
  const dropdownResidenceKavling = ref<Option[]>([]);
  const dropdownFamilyHead = ref<Option[]>([]);
  const dropdownPosition = ref<Option[]>([]);

  const fetchDropdown = async (
    url: string,
    targetRef: Ref<Option[]>,
    label: string
  ) => {
    try {
      const response = await useApi<ApiResponse<Option[]>>(url, { method: 'GET' });

      if (response.status === 1) {
        targetRef.value = response.data || [];
      }
    } catch (error) {
      console.error(`Error fetching ${label}:`, error);
      toast.add({
        title: 'Gagal Memuat Data',
        description: `Terjadi kesalahan saat mengambil data ${label}.`,
        color: 'error'
      });
    }
  };

  // Actions
  const getDropdownRT = () =>
    fetchDropdown('/dropdown/rt', dropdownRT, 'Data RT');

  const getDropdownAddress = (idRT: string | number) =>
    fetchDropdown(`/dropdown/address/${idRT}`, dropdownAddress, 'Alamat');

  const getDropdownResidenceType = (idRT: string | number) =>
    fetchDropdown(`/dropdown/residance-type/${idRT}`, dropdownResidenceType, 'Tipe Hunian');

  const getDropdownResidenceKavling = (idRT: string | number) =>
    fetchDropdown(`/dropdown/residance-kavling/${idRT}`, dropdownResidenceKavling, 'Kavling');

  const getDropdownFamilyHead = () =>
    fetchDropdown(`/dropdown/familly-head`, dropdownFamilyHead, 'Kepala Keluarga');

  const getDropdownPosition = (idRT: string | number) =>
    fetchDropdown(`/dropdown/position/${idRT}`, dropdownPosition, 'Position');

  return {
    dropdownRT,
    dropdownAddress,
    dropdownResidenceType,
    dropdownResidenceKavling,
    dropdownFamilyHead,
    dropdownPosition,
    getDropdownRT,
    getDropdownAddress,
    getDropdownResidenceType,
    getDropdownResidenceKavling,
    getDropdownFamilyHead,
    getDropdownPosition
  };
};
