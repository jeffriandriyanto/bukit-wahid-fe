<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const config = useRuntimeConfig()
const toast = useToast()

const now = new Date()
const selectedMonth = ref(now.getMonth() + 1)
const selectedYear = ref(now.getFullYear())
const hideZero = ref(false)
const searchQuery = ref('')
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

interface NRLRow {
  tag: number
  name: string
  category: string
  pos: string
  normal_balance: string
  opening_debit: number
  opening_credit: number
  movement_debit: number
  movement_credit: number
  ending_debit: number
  ending_credit: number
  lr_debit: number
  lr_credit: number
  nrc_debit: number
  nrc_credit: number
  has_activity: boolean
}

interface NRLData {
  period: {
    month: number
    year: number
    label: string
    start_date: string
    end_date: string
  }
  rows: NRLRow[]
  summary: {
    opening: { debit: number; credit: number; is_balance: boolean }
    movement: { debit: number; credit: number; is_balance: boolean }
    ending: { debit: number; credit: number; is_balance: boolean }
    lr: { debit: number; credit: number; net_income: number; status: 'LABA' | 'RUGI' }
    nrc: { debit: number; credit: number; net_difference: number }
    reconciliation: {
      lr_debit: number
      lr_credit: number
      nrc_debit: number
      nrc_credit: number
      final_nrc_debit: number
      final_nrc_credit: number
      is_balance: boolean
    }
  }
}

const reportData = ref<NRLData>({
  period: {
    month: selectedMonth.value,
    year: selectedYear.value,
    label: '',
    start_date: '',
    end_date: ''
  },
  rows: [],
  summary: {
    opening: { debit: 0, credit: 0, is_balance: true },
    movement: { debit: 0, credit: 0, is_balance: true },
    ending: { debit: 0, credit: 0, is_balance: true },
    lr: { debit: 0, credit: 0, net_income: 0, status: 'LABA' },
    nrc: { debit: 0, credit: 0, net_difference: 0 },
    reconciliation: {
      lr_debit: 0,
      lr_credit: 0,
      nrc_debit: 0,
      nrc_credit: 0,
      final_nrc_debit: 0,
      final_nrc_credit: 0,
      is_balance: true
    }
  }
})

const formatCurrency = (val: number | undefined) => {
  if (!val) return '0'
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0
  }).format(val)
}

const filteredRows = computed(() => {
  let rows = reportData.value.rows || []
  if (hideZero.value) {
    rows = rows.filter((r) => r.has_activity)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    rows = rows.filter(
      (r) =>
        String(r.tag).includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.category && r.category.toLowerCase().includes(q))
    )
  }
  return rows
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await useApi('/finance/reports/trial-balance', {
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
      title: 'Gagal memuat neraca lajur',
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
    year: String(selectedYear.value),
    hide_zero: hideZero.value ? '1' : '0'
  })
  const url = `${config.public.baseUrl}finance/reports/trial-balance/export?${params.toString()}`
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
        <div class="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm border border-blue-100">
          <UIcon name="i-lucide-scale" class="w-6 h-6" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold text-gray-900">
              Neraca Lajur (NRL)
            </h2>
            <UBadge variant="subtle" color="primary" size="sm">
              {{ reportData.period.label || 'Memuat...' }}
            </UBadge>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">
            10-Column Accounting Worksheet — Saldo Awal, Pergerakan, Saldo Akhir, Laba Rugi & Neraca
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
      <div class="flex flex-wrap items-center gap-3">
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

      <div class="flex items-center gap-4">
        <div class="w-64">
          <UInput
            v-model="searchQuery"
            placeholder="Cari kode/nama akun..."
            icon="i-lucide-search"
            size="sm"
          />
        </div>

        <label class="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
          <input
            v-model="hideZero"
            type="checkbox"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
          />
          <span>Sembunyikan Saldo Nol</span>
        </label>
      </div>
    </div>

    <!-- Summary Balance Alert Card -->
    <div
      class="rounded-2xl p-4 border flex items-center justify-between transition"
      :class="reportData.summary.reconciliation.is_balance ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 'bg-amber-50/80 border-amber-200 text-amber-900'"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
          :class="reportData.summary.reconciliation.is_balance ? 'bg-emerald-600' : 'bg-amber-600'"
        >
          <UIcon :name="reportData.summary.reconciliation.is_balance ? 'i-lucide-check' : 'i-lucide-alert-circle'" class="w-5 h-5" />
        </div>
        <div>
          <h4 class="font-bold text-sm">
            Status Neraca Lajur: {{ reportData.summary.reconciliation.is_balance ? 'BALANCE' : 'PENYESUAIAN SALDO' }}
          </h4>
          <p class="text-xs opacity-80">
            Hasil Laba Rugi Periode: <span class="font-bold font-mono">Rp {{ formatCurrency(reportData.summary.lr.net_income) }}</span> ({{ reportData.summary.lr.status }})
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <UBadge
          :color="reportData.summary.reconciliation.is_balance ? 'success' : 'warning'"
          variant="solid"
          size="md"
          class="font-bold px-3 py-1"
        >
          {{ reportData.summary.reconciliation.is_balance ? 'BALANCE' : 'MENUNGGU REKONSILIASI' }}
        </UBadge>
      </div>
    </div>

    <!-- 10-Column Table Container -->
    <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto max-h-[700px]">
        <table class="w-full text-xs text-left border-collapse">
          <thead class="sticky top-0 z-10 bg-slate-800 text-white font-semibold">
            <!-- Level 1 Header -->
            <tr class="border-b border-slate-700 text-center">
              <th rowspan="2" class="px-3 py-3 w-16 border-r border-slate-700">Kode</th>
              <th rowspan="2" class="px-4 py-3 min-w-[200px] border-r border-slate-700 text-left">Nama Akun</th>
              <th rowspan="2" class="px-2 py-3 w-12 border-r border-slate-700">Pos</th>
              <th rowspan="2" class="px-2 py-3 w-12 border-r border-slate-700">SN</th>
              <th colspan="2" class="px-3 py-2 border-r border-slate-700 bg-slate-700/60">Saldo Awal</th>
              <th colspan="2" class="px-3 py-2 border-r border-slate-700 bg-slate-700/80">Pergerakan (Mutasi)</th>
              <th colspan="2" class="px-3 py-2 border-r border-slate-700 bg-slate-700/60">Saldo Akhir</th>
              <th colspan="2" class="px-3 py-2 border-r border-slate-700 bg-amber-900/60">Laba Rugi</th>
              <th colspan="2" class="px-3 py-2 bg-blue-900/60">Neraca</th>
            </tr>
            <!-- Level 2 Sub-Header -->
            <tr class="text-center text-[11px] border-b border-slate-700">
              <th class="px-2 py-1.5 w-24 border-r border-slate-700 bg-slate-700/40 text-emerald-300">Debet</th>
              <th class="px-2 py-1.5 w-24 border-r border-slate-700 bg-slate-700/40 text-purple-300">Kredit</th>
              <th class="px-2 py-1.5 w-24 border-r border-slate-700 bg-slate-700/60 text-emerald-300">Debet</th>
              <th class="px-2 py-1.5 w-24 border-r border-slate-700 bg-slate-700/60 text-purple-300">Kredit</th>
              <th class="px-2 py-1.5 w-24 border-r border-slate-700 bg-slate-700/40 text-emerald-300">Debet</th>
              <th class="px-2 py-1.5 w-24 border-r border-slate-700 bg-slate-700/40 text-purple-300">Kredit</th>
              <th class="px-2 py-1.5 w-24 border-r border-slate-700 bg-amber-900/40 text-amber-300">Debet</th>
              <th class="px-2 py-1.5 w-24 border-r border-slate-700 bg-amber-900/40 text-amber-300">Kredit</th>
              <th class="px-2 py-1.5 w-24 border-r border-slate-700 bg-blue-900/40 text-blue-300">Debet</th>
              <th class="px-2 py-1.5 w-24 bg-blue-900/40 text-blue-300">Kredit</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100 font-mono">
            <tr
              v-for="row in filteredRows"
              :key="row.tag"
              class="hover:bg-slate-50 transition"
              :class="{ 'bg-gray-50/40 opacity-60': !row.has_activity }"
            >
              <td class="px-3 py-2 text-center font-bold text-gray-700 border-r border-gray-100">{{ row.tag }}</td>
              <td class="px-4 py-2 font-sans font-medium text-gray-900 border-r border-gray-100 flex items-center justify-between">
                <span>{{ row.name }}</span>
                <span class="text-[10px] text-gray-400 font-normal ml-2">{{ row.category }}</span>
              </td>
              <td class="px-2 py-2 text-center border-r border-gray-100">
                <span :class="row.pos === 'LR' ? 'text-amber-600 font-bold' : 'text-blue-600 font-bold'">{{ row.pos }}</span>
              </td>
              <td class="px-2 py-2 text-center border-r border-gray-100 uppercase text-gray-500 font-bold">{{ row.normal_balance }}</td>

              <!-- Saldo Awal -->
              <td class="px-2 py-2 text-right border-r border-gray-100" :class="row.opening_debit ? 'text-gray-900 font-semibold' : 'text-gray-300'">
                {{ row.opening_debit ? formatCurrency(row.opening_debit) : '-' }}
              </td>
              <td class="px-2 py-2 text-right border-r border-gray-100" :class="row.opening_credit ? 'text-gray-900 font-semibold' : 'text-gray-300'">
                {{ row.opening_credit ? formatCurrency(row.opening_credit) : '-' }}
              </td>

              <!-- Pergerakan -->
              <td class="px-2 py-2 text-right border-r border-gray-100" :class="row.movement_debit ? 'text-emerald-700 font-bold' : 'text-gray-300'">
                {{ row.movement_debit ? formatCurrency(row.movement_debit) : '-' }}
              </td>
              <td class="px-2 py-2 text-right border-r border-gray-100" :class="row.movement_credit ? 'text-purple-700 font-bold' : 'text-gray-300'">
                {{ row.movement_credit ? formatCurrency(row.movement_credit) : '-' }}
              </td>

              <!-- Saldo Akhir -->
              <td class="px-2 py-2 text-right border-r border-gray-100 bg-slate-50/50" :class="row.ending_debit ? 'text-gray-900 font-bold' : 'text-gray-300'">
                {{ row.ending_debit ? formatCurrency(row.ending_debit) : '-' }}
              </td>
              <td class="px-2 py-2 text-right border-r border-gray-100 bg-slate-50/50" :class="row.ending_credit ? 'text-gray-900 font-bold' : 'text-gray-300'">
                {{ row.ending_credit ? formatCurrency(row.ending_credit) : '-' }}
              </td>

              <!-- Laba Rugi -->
              <td class="px-2 py-2 text-right border-r border-gray-100 bg-amber-50/30" :class="row.lr_debit ? 'text-amber-800 font-bold' : 'text-gray-300'">
                {{ row.lr_debit ? formatCurrency(row.lr_debit) : '-' }}
              </td>
              <td class="px-2 py-2 text-right border-r border-gray-100 bg-amber-50/30" :class="row.lr_credit ? 'text-amber-800 font-bold' : 'text-gray-300'">
                {{ row.lr_credit ? formatCurrency(row.lr_credit) : '-' }}
              </td>

              <!-- Neraca -->
              <td class="px-2 py-2 text-right border-r border-gray-100 bg-blue-50/30" :class="row.nrc_debit ? 'text-blue-800 font-bold' : 'text-gray-300'">
                {{ row.nrc_debit ? formatCurrency(row.nrc_debit) : '-' }}
              </td>
              <td class="px-2 py-2 text-right bg-blue-50/30" :class="row.nrc_credit ? 'text-blue-800 font-bold' : 'text-gray-300'">
                {{ row.nrc_credit ? formatCurrency(row.nrc_credit) : '-' }}
              </td>
            </tr>

            <tr v-if="!filteredRows.length">
              <td colspan="14" class="px-4 py-8 text-center text-gray-400 font-sans">
                Tidak ada data akun yang sesuai dengan filter pencarian.
              </td>
            </tr>
          </tbody>

          <!-- Table Footer -->
          <tfoot class="sticky bottom-0 z-10 bg-slate-100 font-bold font-mono text-xs border-t-2 border-slate-300">
            <!-- Row TOTAL -->
            <tr class="bg-slate-200/80 border-b border-slate-300 text-gray-900">
              <td colspan="4" class="px-4 py-2.5 font-sans uppercase text-center font-black">TOTAL</td>
              <td class="px-2 py-2.5 text-right">{{ formatCurrency(reportData.summary.opening.debit) }}</td>
              <td class="px-2 py-2.5 text-right">{{ formatCurrency(reportData.summary.opening.credit) }}</td>
              <td class="px-2 py-2.5 text-right text-emerald-700">{{ formatCurrency(reportData.summary.movement.debit) }}</td>
              <td class="px-2 py-2.5 text-right text-purple-700">{{ formatCurrency(reportData.summary.movement.credit) }}</td>
              <td class="px-2 py-2.5 text-right">{{ formatCurrency(reportData.summary.ending.debit) }}</td>
              <td class="px-2 py-2.5 text-right">{{ formatCurrency(reportData.summary.ending.credit) }}</td>
              <td class="px-2 py-2.5 text-right text-amber-800">{{ formatCurrency(reportData.summary.lr.debit) }}</td>
              <td class="px-2 py-2.5 text-right text-amber-800">{{ formatCurrency(reportData.summary.lr.credit) }}</td>
              <td class="px-2 py-2.5 text-right text-blue-800">{{ formatCurrency(reportData.summary.nrc.debit) }}</td>
              <td class="px-2 py-2.5 text-right text-blue-800">{{ formatCurrency(reportData.summary.nrc.credit) }}</td>
            </tr>

            <!-- Row LABA / RUGI BERJALAN -->
            <tr class="bg-amber-100/70 border-b border-amber-200 text-amber-950">
              <td colspan="4" class="px-4 py-2 font-sans uppercase text-center font-bold">
                {{ reportData.summary.lr.status === 'LABA' ? 'LABA PERIODE BERJALAN' : 'RUGI PERIODE BERJALAN' }}
              </td>
              <td colspan="6" class="px-2 py-2 text-center text-gray-400 font-sans font-normal">-</td>
              <td class="px-2 py-2 text-right">{{ formatCurrency(reportData.summary.reconciliation.lr_debit) }}</td>
              <td class="px-2 py-2 text-right">{{ formatCurrency(reportData.summary.reconciliation.lr_credit) }}</td>
              <td class="px-2 py-2 text-right text-blue-900">{{ formatCurrency(reportData.summary.reconciliation.nrc_debit) }}</td>
              <td class="px-2 py-2 text-right text-blue-900">{{ formatCurrency(reportData.summary.reconciliation.nrc_credit) }}</td>
            </tr>

            <!-- Row BALANCE AKHIR -->
            <tr
              class="border-t-2 border-slate-400 font-black text-sm"
              :class="reportData.summary.reconciliation.is_balance ? 'bg-emerald-100 text-emerald-950' : 'bg-rose-100 text-rose-950'"
            >
              <td colspan="4" class="px-4 py-3 font-sans uppercase text-center tracking-wider">
                {{ reportData.summary.reconciliation.is_balance ? 'BALANCE' : 'TIDAK BALANCE' }}
              </td>
              <td colspan="6" class="px-2 py-3 text-center text-gray-400 font-sans font-normal text-xs">-</td>
              <td colspan="2" class="px-2 py-3 text-center font-sans font-semibold text-xs text-gray-500">SEIMBANG</td>
              <td class="px-2 py-3 text-right">{{ formatCurrency(reportData.summary.reconciliation.final_nrc_debit) }}</td>
              <td class="px-2 py-3 text-right">{{ formatCurrency(reportData.summary.reconciliation.final_nrc_credit) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>
