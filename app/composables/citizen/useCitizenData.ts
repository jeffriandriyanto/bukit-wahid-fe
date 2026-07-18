import { watchWithFilter, debounceFilter } from '@vueuse/core'

export const useCitizenData = () => {
  const { dropdownRT, getDropdownRT } = useApiDropdown()

  // --- Data & Pagination ---
  const dataCitizen = ref<any[]>([])
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  })
  const loading = ref(false)

  // --- Search & Filter ---
  const search = ref('')
  const selectedRT = ref(null)
  const selectedAgeGroup = ref(null)
  const selectedReligion = ref(null)
  const tempRT = ref(null)
  const tempAgeGroup = ref(null)
  const tempReligion = ref(null)
  const isFilterModalOpen = ref(false)

  // --- Computed ---
  const activeFilterCount = computed(() => {
    let count = 0
    if (selectedRT.value) count++
    if (selectedAgeGroup.value) count++
    if (selectedReligion.value) count++
    return count
  })

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

  // --- Watchers ---
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
    // State
    dataCitizen,
    pagination,
    loading,
    search,
    selectedRT,
    selectedAgeGroup,
    selectedReligion,
    tempRT,
    tempAgeGroup,
    tempReligion,
    isFilterModalOpen,
    activeFilterCount,
    dropdownRT,
    // Actions
    getData,
    applyFilters,
    resetFilters
  }
}
