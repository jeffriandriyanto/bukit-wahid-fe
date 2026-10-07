<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

// --- STATE ---
const loading = ref(false)
const recapData = ref<any[]>([])

// --- TABLE COLUMNS ---
const recapTable = [
  { accessorKey: 'tag', header: 'Tag/COA' },
  { accessorKey: 'name', header: 'Kategori / Nama Akun' },
  { accessorKey: 'debit', header: 'Total Debit' },
  { accessorKey: 'credit', header: 'Total Kredit' },
  { accessorKey: 'balance', header: 'Saldo Akhir' }
]

// --- SUMMARY STATS ---
const totalDebit = computed(() =>
  recapData.value.reduce((sum, item) => sum + (Number(item.debit) || 0), 0)
)
const totalCredit = computed(() =>
  recapData.value.reduce((sum, item) => sum + (Number(item.credit) || 0), 0)
)

// --- ACTIONS ---
const getData = async () => {
  loading.value = true
  try {
    const res = await useApi('/finance/recap')
    if (res.status === 1) {
      recapData.value = res.data || []
    }
  } catch (err) {
    console.error('Failed to fetch recap data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getData()
})

const handleExport = () => {
  const config = useRuntimeConfig()
  const url = `${config.public.baseUrl}finance/recap/export`
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
          <p class="text-xs text-gray-500">Rekapitulasi total seluruh akun neraca dan laba rugi (Kumulatif)</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          color="neutral"
          variant="outline"
          icon="mdi:file-excel"
          @click="handleExport"
        >
          Export Excel
        </UButton>
      </div>
    </SharedHeaderBg>

    <!-- Stat Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Debit Keseluruhan</span>
          <p class="text-lg font-bold text-emerald-600 mt-1">
            {{ formatCurrency(totalDebit) }}
          </p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          <UIcon name="i-lucide-arrow-down-left" class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Kredit Keseluruhan</span>
          <p class="text-lg font-bold text-rose-600 mt-1">
            {{ formatCurrency(totalCredit) }}
          </p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
          <UIcon name="i-lucide-arrow-up-right" class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Jumlah Akun Aktif</span>
          <p class="text-lg font-bold text-gray-900 mt-1">
            {{ recapData.length }} Akun COA
          </p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
          <UIcon name="i-lucide-layers" class="w-5 h-5" />
        </div>
      </div>
    </div>

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
          <span class="text-emerald-600 font-medium">
            {{ formatCurrency(row.original.debit) }}
          </span>
        </template>

        <!-- Slot Credit -->
        <template #credit-cell="{ row }">
          <span class="text-rose-600 font-medium">
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
          Tidak ada data rekapitulasi.
        </p>
      </div>
    </div>
  </div>
</template>
