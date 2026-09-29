<script setup lang="ts">
definePageMeta({ middleware: ['auth'], title: 'Laporan Keuangan' })

const config = useRuntimeConfig()
const toast = useToast()

const now = new Date()
const selectedMonth = ref(now.getMonth() + 1)
const selectedYear = ref(now.getFullYear())
const loading = ref(false)

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

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear; i >= 2023; i--) {
    years.push({ label: String(i), value: i })
  }
  return years
})

interface LRData {
  period: {
    month: number
    year: number
    label: string
    start_date: string
    end_date: string
  }
  revenues: Array<{
    tag: number
    name: string
    category: string
    debit: number
    credit: number
    amount: number
  }>
  total_revenue: number
  gross_profit: number
  overhead_expenses: Array<{
    tag: number
    name: string
    category: string
    debit: number
    credit: number
    amount: number
  }>
  total_overhead: number
  operational_expenses: Array<{
    tag: number
    name: string
    category: string
    debit: number
    credit: number
    amount: number
  }>
  total_operational: number
  total_expenses: number
  net_profit: number
  status: 'LABA' | 'RUGI'
}

const reportData = ref<LRData>({
  period: {
    month: selectedMonth.value,
    year: selectedYear.value,
    label: '',
    start_date: '',
    end_date: ''
  },
  revenues: [],
  total_revenue: 0,
  gross_profit: 0,
  overhead_expenses: [],
  total_overhead: 0,
  operational_expenses: [],
  total_operational: 0,
  total_expenses: 0,
  net_profit: 0,
  status: 'LABA'
})

const formatCurrency = (val: number | undefined) => {
  if (val === undefined || val === null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val)
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await useApi('/finance/reports/income-statement', {
      method: 'GET',
      params: {
        month: selectedMonth.value,
        year: selectedYear.value
      }
    })

    if (res.status === 1 && res.data) {
      reportData.value = res.data
    }
  } catch (err: any) {
    toast.add({
      title: 'Gagal memuat laporan laba rugi',
      description: err?.message || 'Terjadi kesalahan sistem',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const handleExport = () => {
  const params = new URLSearchParams({
    month: String(selectedMonth.value),
    year: String(selectedYear.value)
  })
  const url = `${config.public.baseUrl}finance/reports/income-statement/export?${params.toString()}`
  window.open(url, '_blank')
}

watch([selectedMonth, selectedYear], () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <SharedHeaderBg>
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm border border-emerald-100">
          <UIcon name="i-lucide-trending-up" class="w-6 h-6" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold text-gray-900">
              Laporan Laba Rugi (LR)
            </h2>
            <UBadge variant="subtle" color="primary" size="sm">
              {{ reportData.period.label || 'Memuat...' }}
            </UBadge>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">
            Estate Management Bukit Wahid Regency — Rincian Pendapatan, Biaya Overhead & Operasional
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          color="success"
          variant="solid"
          icon="i-lucide-file-spreadsheet"
          :loading="loading"
          @click="handleExport"
        >
          Cetak Excel (.xlsx)
        </UButton>
      </div>
    </SharedHeaderBg>

    <!-- Toolbar Filters -->
    <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Periode:</span>
        <USelect
          v-model="selectedMonth"
          :items="monthOptions"
          value-attribute="value"
          option-attribute="label"
          class="w-36"
        />
        <USelect
          v-model="selectedYear"
          :items="yearOptions"
          value-attribute="value"
          option-attribute="label"
          class="w-28"
        />
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          size="sm"
          :loading="loading"
          @click="fetchData"
        >
          Refresh
        </UButton>
      </div>

      <div class="text-xs text-gray-400">
        Rentang: <span class="font-medium text-gray-600">{{ reportData.period.start_date }}</span> s/d <span class="font-medium text-gray-600">{{ reportData.period.end_date }}</span>
      </div>
    </div>

    <!-- Summary Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Pendapatan -->
      <div class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Pendapatan</span>
          <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UIcon name="i-lucide-arrow-down-left" class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3">
          <span class="text-2xl font-black text-gray-900 tracking-tight">
            {{ formatCurrency(reportData.total_revenue) }}
          </span>
        </div>
        <p class="text-xs text-emerald-600 font-medium mt-1">
          IPL, Air, Iuran RW & Lain-lain
        </p>
      </div>

      <!-- Total Overhead -->
      <div class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Biaya Overhead EM</span>
          <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <UIcon name="i-lucide-users" class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3">
          <span class="text-2xl font-black text-gray-900 tracking-tight">
            {{ formatCurrency(reportData.total_overhead) }}
          </span>
        </div>
        <p class="text-xs text-amber-600 font-medium mt-1">
          Gaji, BPJS, THR, Seragam, dll.
        </p>
      </div>

      <!-- Total Operasional -->
      <div class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Biaya Operasional EM</span>
          <div class="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
            <UIcon name="i-lucide-wrench" class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3">
          <span class="text-2xl font-black text-gray-900 tracking-tight">
            {{ formatCurrency(reportData.total_operational) }}
          </span>
        </div>
        <p class="text-xs text-orange-600 font-medium mt-1">
          Listrik PJU/Sumur, Maintenance, dll.
        </p>
      </div>

      <!-- Laba/Rugi Bersih -->
      <div
        class="border rounded-2xl p-5 shadow-sm relative overflow-hidden"
        :class="reportData.net_profit >= 0 ? 'bg-emerald-900 text-white border-emerald-800' : 'bg-rose-900 text-white border-rose-800'"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium uppercase tracking-wide opacity-80">
            {{ reportData.status === 'LABA' ? 'Laba Bersih' : 'Rugi Bersih' }}
          </span>
          <UBadge
            :color="reportData.net_profit >= 0 ? 'success' : 'error'"
            variant="solid"
            size="xs"
            class="font-bold"
          >
            {{ reportData.status }}
          </UBadge>
        </div>
        <div class="mt-3">
          <span class="text-2xl font-black tracking-tight">
            {{ formatCurrency(reportData.net_profit) }}
          </span>
        </div>
        <p class="text-xs opacity-75 mt-1">
          Pendapatan - (Overhead + Operasional)
        </p>
      </div>
    </div>

    <!-- Main Report Tables -->
    <div class="space-y-6">
      <!-- 1. PENDAPATAN EM -->
      <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div class="bg-blue-50/70 border-b border-blue-100 px-6 py-3.5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-coins" class="w-5 h-5 text-blue-600" />
            <h3 class="font-bold text-gray-900 text-sm tracking-wide uppercase">
              1. Pendapatan EM
            </h3>
          </div>
          <span class="text-xs font-semibold text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-full">
            Subtotal: {{ formatCurrency(reportData.total_revenue) }}
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-gray-50/75 text-gray-500 font-semibold text-xs border-b border-gray-100">
              <tr>
                <th class="px-6 py-3 w-28 text-center font-mono">Kode</th>
                <th class="px-6 py-3">Nama Akun Pendapatan</th>
                <th class="px-6 py-3 text-right">Debit (Rp)</th>
                <th class="px-6 py-3 text-right">Kredit (Rp)</th>
                <th class="px-6 py-3 text-right font-bold w-48">Jumlah Saldo (Rp)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="rev in reportData.revenues"
                :key="rev.tag"
                class="hover:bg-gray-50/50 transition"
              >
                <td class="px-6 py-3 text-center font-mono font-semibold text-gray-700">{{ rev.tag }}</td>
                <td class="px-6 py-3 font-medium text-gray-800">{{ rev.name }}</td>
                <td class="px-6 py-3 text-right font-mono text-gray-500">{{ rev.debit ? formatCurrency(rev.debit) : '-' }}</td>
                <td class="px-6 py-3 text-right font-mono text-gray-500">{{ rev.credit ? formatCurrency(rev.credit) : '-' }}</td>
                <td class="px-6 py-3 text-right font-mono font-bold text-emerald-600">{{ formatCurrency(rev.amount) }}</td>
              </tr>
              <tr v-if="!reportData.revenues.length">
                <td colspan="5" class="px-6 py-6 text-center text-gray-400">Tidak ada transaksi pendapatan pada periode ini.</td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-200">
              <tr>
                <td colspan="2" class="px-6 py-3 text-right uppercase text-xs">Total Pendapatan EM:</td>
                <td colspan="3" class="px-6 py-3 text-right font-mono text-emerald-700 text-base">
                  {{ formatCurrency(reportData.total_revenue) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- 2. BIAYA OVERHEAD EM -->
      <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div class="bg-amber-50/70 border-b border-amber-100 px-6 py-3.5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-briefcase" class="w-5 h-5 text-amber-600" />
            <h3 class="font-bold text-gray-900 text-sm tracking-wide uppercase">
              2. Biaya Overhead EM
            </h3>
          </div>
          <span class="text-xs font-semibold text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-full">
            Subtotal: {{ formatCurrency(reportData.total_overhead) }}
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-gray-50/75 text-gray-500 font-semibold text-xs border-b border-gray-100">
              <tr>
                <th class="px-6 py-3 w-28 text-center font-mono">Kode</th>
                <th class="px-6 py-3">Rincian Pos Biaya Overhead</th>
                <th class="px-6 py-3 text-right">Debit (Rp)</th>
                <th class="px-6 py-3 text-right">Kredit (Rp)</th>
                <th class="px-6 py-3 text-right font-bold w-48">Jumlah Beban (Rp)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="ovh in reportData.overhead_expenses"
                :key="ovh.tag"
                class="hover:bg-gray-50/50 transition"
              >
                <td class="px-6 py-3 text-center font-mono font-semibold text-gray-700">{{ ovh.tag }}</td>
                <td class="px-6 py-3 font-medium text-gray-800">{{ ovh.name }}</td>
                <td class="px-6 py-3 text-right font-mono text-gray-500">{{ ovh.debit ? formatCurrency(ovh.debit) : '-' }}</td>
                <td class="px-6 py-3 text-right font-mono text-gray-500">{{ ovh.credit ? formatCurrency(ovh.credit) : '-' }}</td>
                <td class="px-6 py-3 text-right font-mono font-bold text-amber-700">{{ formatCurrency(ovh.amount) }}</td>
              </tr>
              <tr v-if="!reportData.overhead_expenses.length">
                <td colspan="5" class="px-6 py-6 text-center text-gray-400">Tidak ada pos biaya overhead.</td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-200">
              <tr>
                <td colspan="2" class="px-6 py-3 text-right uppercase text-xs">Total Biaya Overhead EM:</td>
                <td colspan="3" class="px-6 py-3 text-right font-mono text-amber-800 text-base">
                  {{ formatCurrency(reportData.total_overhead) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- 3. BIAYA OPERASIONAL EM -->
      <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div class="bg-orange-50/70 border-b border-orange-100 px-6 py-3.5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-wrench" class="w-5 h-5 text-orange-600" />
            <h3 class="font-bold text-gray-900 text-sm tracking-wide uppercase">
              3. Biaya Operasional EM
            </h3>
          </div>
          <span class="text-xs font-semibold text-orange-700 bg-orange-100/70 px-2.5 py-1 rounded-full">
            Subtotal: {{ formatCurrency(reportData.total_operational) }}
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-gray-50/75 text-gray-500 font-semibold text-xs border-b border-gray-100">
              <tr>
                <th class="px-6 py-3 w-28 text-center font-mono">Kode</th>
                <th class="px-6 py-3">Rincian Pos Biaya Operasional</th>
                <th class="px-6 py-3 text-right">Debit (Rp)</th>
                <th class="px-6 py-3 text-right">Kredit (Rp)</th>
                <th class="px-6 py-3 text-right font-bold w-48">Jumlah Beban (Rp)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="ops in reportData.operational_expenses"
                :key="ops.tag"
                class="hover:bg-gray-50/50 transition"
              >
                <td class="px-6 py-3 text-center font-mono font-semibold text-gray-700">{{ ops.tag }}</td>
                <td class="px-6 py-3 font-medium text-gray-800">{{ ops.name }}</td>
                <td class="px-6 py-3 text-right font-mono text-gray-500">{{ ops.debit ? formatCurrency(ops.debit) : '-' }}</td>
                <td class="px-6 py-3 text-right font-mono text-gray-500">{{ ops.credit ? formatCurrency(ops.credit) : '-' }}</td>
                <td class="px-6 py-3 text-right font-mono font-bold text-orange-700">{{ formatCurrency(ops.amount) }}</td>
              </tr>
              <tr v-if="!reportData.operational_expenses.length">
                <td colspan="5" class="px-6 py-6 text-center text-gray-400">Tidak ada pos biaya operasional.</td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-200">
              <tr>
                <td colspan="2" class="px-6 py-3 text-right uppercase text-xs">Total Biaya Operasional EM:</td>
                <td colspan="3" class="px-6 py-3 text-right font-mono text-orange-800 text-base">
                  {{ formatCurrency(reportData.total_operational) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- 4. REKAPITULASI TOTAL BIAYA & LABA/RUGI BERSIH -->
      <div class="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm">
        <div class="space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-gray-100 text-sm">
            <span class="text-gray-600 font-semibold">A. Total Pendapatan EM</span>
            <span class="font-mono font-bold text-emerald-600 text-base">{{ formatCurrency(reportData.total_revenue) }}</span>
          </div>

          <div class="flex items-center justify-between pb-3 border-b border-gray-100 text-sm">
            <span class="text-gray-600 font-semibold">B. Total Biaya Overhead EM</span>
            <span class="font-mono font-bold text-amber-600 text-base">{{ formatCurrency(reportData.total_overhead) }}</span>
          </div>

          <div class="flex items-center justify-between pb-3 border-b border-gray-100 text-sm">
            <span class="text-gray-600 font-semibold">C. Total Biaya Operasional EM</span>
            <span class="font-mono font-bold text-orange-600 text-base">{{ formatCurrency(reportData.total_operational) }}</span>
          </div>

          <div class="flex items-center justify-between pb-3 border-b-2 border-gray-200 text-sm bg-gray-50 -mx-6 px-6 py-2">
            <span class="text-gray-900 font-bold">TOTAL BIAYA EM (B + C)</span>
            <span class="font-mono font-black text-gray-900 text-base">{{ formatCurrency(reportData.total_expenses) }}</span>
          </div>

          <div
            class="flex items-center justify-between rounded-xl p-4 transition"
            :class="reportData.net_profit >= 0 ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'"
          >
            <div>
              <h4 class="font-black text-base uppercase tracking-wide">
                {{ reportData.status === 'LABA' ? 'LABA BERSIH PERIODE BERJALAN' : 'RUGI BERSIH PERIODE BERJALAN' }}
              </h4>
              <p class="text-xs opacity-75">Selisih Total Pendapatan dikurangi Total Beban EM</p>
            </div>
            <div class="text-right">
              <span class="text-2xl font-black font-mono">
                {{ formatCurrency(reportData.net_profit) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
