<script setup lang="ts">
// --- STATE ---
const loading = ref(false)
const recapData = ref<any[]>([])

// Filter State (Default ke tahun dan bulan berjalan)
const now = new Date()
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1)

// --- OPTIONS ---
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear; i >= 2023; i--) {
    years.push({ label: i.toString(), value: i })
  }
  return years
})

const monthOptions = [
  { label: 'Januari', value: 1 },
  { label: 'Februari', value: 2 },
  { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },
  { label: 'Agustus', value: 8 },
  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },
  { label: 'November', value: 11 },
  { label: 'Desember', value: 12 }
]

// --- TABLE COLUMNS ---
const recapTable = [
  { accessorKey: 'tag', header: 'Tag/COA' },
  { accessorKey: 'name', header: 'Kategori / Nama Akun' },
  { accessorKey: 'debit', header: 'Total Debit' },
  { accessorKey: 'credit', header: 'Total Kredit' },
  { accessorKey: 'balance', header: 'Saldo Akhir' }
]

// --- ACTIONS ---
const getData = async () => {
  loading.value = true
  try {
    const res = await useApi('/finance/recap', {
      params: {
        year: selectedYear.value,
        month: selectedMonth.value
      }
    })
    if (res.status === 1) {
      recapData.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch recap data:', err)
  } finally {
    loading.value = false
  }
}

// --- HELPERS ---
// Watcher untuk auto-refresh data saat filter berubah
watch([selectedYear, selectedMonth], () => {
  getData()
})

onMounted(() => {
  getData()
})

const handleExport = () => {
  const config = useRuntimeConfig()
  const params = new URLSearchParams()
  params.set('month', selectedMonth.value.toString())
  params.set('year', selectedYear.value.toString())
  const url = `${config.public.baseUrl}finance/recap/export?${params.toString()}`
  window.open(url, '_blank')
}
</script>

<template>
  <div class="space-y-4">
    <SharedHeaderBg>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary-50 rounded-lg">
          <UIcon name="i-lucide-bar-chart-3" class="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-900">Rekapitulasi Keuangan</h2>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <USelect
          v-model="selectedMonth"
          :items="monthOptions"
          label-key="label"
          value-key="value"
          class="w-40"
        />
        <USelect
          v-model="selectedYear"
          :items="yearOptions"
          label-key="label"
          value-key="value"
          class="w-32"
        />
        <UButton
          color="neutral"
          variant="outline"
          icon="mdi:file-excel"
          @click="handleExport"
        >
          Export
        </UButton>
      </div>
    </SharedHeaderBg>

    <div
      class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <UTable :data="recapData" :columns="recapTable" :loading="loading">
        <!-- Slot Tag -->
        <template #tag-cell="{ row }">
          <UBadge variant="subtle" color="neutral" class="font-mono">
            #{{ row.original.tag }}
          </UBadge>
        </template>

        <!-- Slot Nama -->
        <template #name-cell="{ row }">
          <div class="font-medium text-gray-700">{{ row.original.name }}</div>
        </template>

        <!-- Slot Debit -->
        <template #debit-cell="{ row }">
          <span class="text-green-600 font-medium">
            {{ formatCurrency(row.original.debit) }}
          </span>
        </template>

        <!-- Slot Credit -->
        <template #credit-cell="{ row }">
          <span class="text-red-600 font-medium">
            {{ formatCurrency(row.original.credit) }}
          </span>
        </template>

        <!-- Slot Balance -->
        <template #balance-cell="{ row }">
          <div class="font-bold text-gray-900">
            {{ formatCurrency(row.original.balance) }}
          </div>
        </template>
      </UTable>

      <!-- Empty State -->
      <div v-if="recapData.length === 0 && !loading" class="p-10 text-center">
        <UIcon
          name="i-lucide-folder-open"
          class="w-10 h-10 text-gray-300 mx-auto mb-2"
        />
        <p class="text-gray-500 text-sm">
          Tidak ada data rekapitulasi pada periode ini.
        </p>
      </div>
    </div>
  </div>
</template>
