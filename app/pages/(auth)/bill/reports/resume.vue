<script setup lang="ts">
definePageMeta({ middleware: ['auth'], title: 'Laporan Keuangan' })

const config = useRuntimeConfig()
const toast = useToast()

const now = new Date()
const periodType = ref<'monthly' | 'quarterly' | 'yearly'>('monthly')
const selectedMonth = ref(now.getMonth() + 1)
const selectedYear = ref(now.getFullYear())
const selectedQuarter = ref<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1')
const isCumulative = ref(true)
const loading = ref(false)

const periodTypeOptions = [
  { label: 'Bulanan', value: 'monthly', icon: 'i-lucide-calendar-days' },
  { label: 'Triwulan / BEI', value: 'quarterly', icon: 'i-lucide-chart-column' },
  { label: 'Tahunan', value: 'yearly', icon: 'i-lucide-calendar-range' }
]

const quarterOptions = [
  { label: 'Triwulan I (Q1: Jan - Mar)', value: 'Q1' },
  { label: 'Triwulan II (Q2: Apr - Jun)', value: 'Q2' },
  { label: 'Triwulan III (Q3: Jul - Sep)', value: 'Q3' },
  { label: 'Triwulan IV (Q4: Okt - Des)', value: 'Q4' }
]

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

interface ResumeItem {
  no: number
  post: string
  uraian: string
  masuk: number
  keluar: number
}

interface ResumeSection {
  title: string
  items: ResumeItem[]
  total_masuk: number
  total_keluar: number
  net_income: number
  status: 'LABA' | 'RUGI'
}

interface RekapitulasiKekayaan {
  title: string
  pendapatan_bersih_periode: number
  pendapatan_bersih_status: 'LABA' | 'RUGI'
  kekayaan_bersih_awal: number
  kekayaan_bersih_awal_label: string
  kekayaan_bersih_akhir: number
  kekayaan_bersih_akhir_label: string
  notes: string
}

interface ResumeData {
  period: {
    type: string
    month: number
    year: number
    quarter?: string
    is_cumulative?: boolean
    label: string
    start_date: string
    end_date: string
  }
  estate_management: ResumeSection
  iuran_warga: ResumeSection
  rekapitulasi_kekayaan: RekapitulasiKekayaan
}

const resumeData = ref<ResumeData>({
  period: {
    type: 'monthly',
    month: selectedMonth.value,
    year: selectedYear.value,
    label: '',
    start_date: '',
    end_date: ''
  },
  estate_management: {
    title: 'ESTATE MANAGEMENT',
    items: [],
    total_masuk: 0,
    total_keluar: 0,
    net_income: 0,
    status: 'LABA'
  },
  iuran_warga: {
    title: 'IURAN WARGA',
    items: [],
    total_masuk: 0,
    total_keluar: 0,
    net_income: 0,
    status: 'LABA'
  },
  rekapitulasi_kekayaan: {
    title: 'REKAPITULASI KEKAYAAN BERSIH',
    pendapatan_bersih_periode: 0,
    pendapatan_bersih_status: 'LABA',
    kekayaan_bersih_awal: 0,
    kekayaan_bersih_awal_label: 'Kekayaan Bersih Awal',
    kekayaan_bersih_akhir: 0,
    kekayaan_bersih_akhir_label: 'Kekayaan Bersih Akhir',
    notes: 'Kekayaan Bersih adalah Total Aset dikurangi Total Hutang'
  }
})

const formatCurrency = (val: number | undefined) => {
  if (val === undefined || val === null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val)
}

const formatNumber = (val: number | undefined) => {
  if (val === undefined || val === null || val === 0) return '-'
  return new Intl.NumberFormat('id-ID').format(val)
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      period_type: periodType.value,
      year: selectedYear.value
    }
    if (periodType.value === 'monthly') {
      params.month = selectedMonth.value
    } else if (periodType.value === 'quarterly') {
      params.quarter = selectedQuarter.value
      params.is_cumulative = isCumulative.value ? '1' : '0'
    }

    const res = await useApi('/finance/reports/resume', {
      method: 'GET',
      params
    })

    if (res.status === 1 && res.data) {
      resumeData.value = res.data
    }
  } catch (err: any) {
    toast.add({
      title: 'Gagal memuat resume keuangan',
      description: err?.message || 'Terjadi kesalahan sistem',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const handleExport = () => {
  const params = new URLSearchParams({
    period_type: periodType.value,
    year: String(selectedYear.value)
  })
  if (periodType.value === 'monthly') {
    params.set('month', String(selectedMonth.value))
  } else if (periodType.value === 'quarterly') {
    params.set('quarter', selectedQuarter.value)
    params.set('is_cumulative', isCumulative.value ? '1' : '0')
  }
  const url = `${config.public.baseUrl}finance/reports/resume/export?${params.toString()}`
  window.open(url, '_blank')
}

const handlePrint = () => {
  window.print()
}

watch([periodType, selectedMonth, selectedYear, selectedQuarter, isCumulative], () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6 pb-12 print:p-0 print:space-y-4">
    <!-- Header -->
    <SharedHeaderBg class="print:hidden">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm border border-blue-100">
          <UIcon name="i-lucide-file-text" class="w-6 h-6" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold text-gray-900">
              Resume Laporan Keuangan RW XI
            </h2>
            <UBadge variant="subtle" color="primary" size="sm">
              {{ resumeData.period.label || 'Memuat...' }}
            </UBadge>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">
            Bukit Wahid Regency — Rekapitulasi Estate Management, Iuran Warga & Kekayaan Bersih
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-printer"
          @click="handlePrint"
        >
          Cetak
        </UButton>
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
    <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3 print:hidden">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <!-- Tipe Periode Selector (Pills) -->
        <div class="flex items-center bg-gray-100 p-1 rounded-xl gap-1">
          <button
            v-for="item in periodTypeOptions"
            :key="item.value"
            type="button"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
            :class="
              periodType === item.value
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            "
            @click="periodType = item.value as any"
          >
            <UIcon :name="item.icon" class="w-4 h-4" />
            <span>{{ item.label }}</span>
          </button>
        </div>

        <!-- Rentang Tanggal Badge -->
        <div class="text-xs text-gray-500 flex items-center gap-1 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
          <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5 text-gray-400" />
          <span>Rentang:</span>
          <span class="font-semibold text-gray-700">{{ resumeData.period.start_date || '-' }}</span>
          <span class="text-gray-400">s/d</span>
          <span class="font-semibold text-gray-700">{{ resumeData.period.end_date || '-' }}</span>
        </div>
      </div>

      <!-- Controls Row -->
      <div class="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
        <!-- Dropdown Bulan (Khusus mode bulanan) -->
        <div v-if="periodType === 'monthly'" class="flex items-center gap-2">
          <span class="text-xs font-medium text-gray-500">Bulan:</span>
          <USelect
            v-model="selectedMonth"
            :items="monthOptions"
            value-key="value"
            class="w-36"
            size="sm"
          />
        </div>

        <!-- Dropdown Triwulan (Khusus mode quarterly) -->
        <div v-if="periodType === 'quarterly'" class="flex items-center gap-2">
          <span class="text-xs font-medium text-gray-500">Triwulan:</span>
          <USelect
            v-model="selectedQuarter"
            :items="quarterOptions"
            value-key="value"
            class="w-56"
            size="sm"
          />
        </div>

        <!-- Toggle Kumulatif YTD (Khusus mode quarterly) -->
        <div
          v-if="periodType === 'quarterly'"
          class="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs"
        >
          <UToggle v-model="isCumulative" size="sm" />
          <span class="font-medium text-blue-900">
            Kumulatif YTD (dari Jan s/d akhir triwulan)
          </span>
        </div>

        <!-- Dropdown Tahun (Semua mode) -->
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-gray-500">Tahun:</span>
          <USelect
            v-model="selectedYear"
            :items="yearOptions"
            value-key="value"
            class="w-28"
            size="sm"
          />
        </div>
      </div>
    </div>

    <!-- Printable Header Document Title -->
    <div class="text-center py-2 space-y-1">
      <h1 class="text-lg font-bold text-gray-900 uppercase tracking-wide">
        RESUME LAPORAN KEUANGAN RW. XI
      </h1>
      <h2 class="text-base font-semibold text-blue-900 tracking-wider">
        PERUMAHAN BUKIT WAHID REGENCY
      </h2>
      <p class="text-xs text-gray-600 font-medium italic">
        PERIODE : {{ (resumeData.period.label || '').toUpperCase() }}
      </p>
    </div>

    <!-- KPI Summary Highlights -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
      <!-- Card 1: Penerimaan EM -->
      <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <span class="text-xs font-medium text-gray-500">Total Penerimaan EM</span>
        <div class="text-lg font-bold text-gray-900 mt-1">
          {{ formatCurrency(resumeData.estate_management.total_masuk) }}
        </div>
        <div class="text-[11px] text-emerald-600 font-medium mt-0.5">
          IPL + PAM + Pendapatan Lain
        </div>
      </div>

      <!-- Card 2: Laba/Rugi EM -->
      <div
        class="p-4 rounded-2xl border shadow-sm"
        :class="
          resumeData.estate_management.status === 'LABA'
            ? 'bg-emerald-50/50 border-emerald-100'
            : 'bg-rose-50/50 border-rose-100'
        "
      >
        <span class="text-xs font-medium text-gray-500">Hasil Operasional EM</span>
        <div
          class="text-lg font-bold mt-1"
          :class="
            resumeData.estate_management.status === 'LABA'
              ? 'text-emerald-700'
              : 'text-rose-700'
          "
        >
          {{ formatCurrency(resumeData.estate_management.net_income) }}
        </div>
        <UBadge
          :color="resumeData.estate_management.status === 'LABA' ? 'success' : 'error'"
          variant="subtle"
          size="xs"
          class="mt-0.5 font-bold"
        >
          {{ resumeData.estate_management.status }}
        </UBadge>
      </div>

      <!-- Card 3: Laba/Rugi Iuran Warga -->
      <div
        class="p-4 rounded-2xl border shadow-sm"
        :class="
          resumeData.iuran_warga.status === 'LABA'
            ? 'bg-emerald-50/50 border-emerald-100'
            : 'bg-rose-50/50 border-rose-100'
        "
      >
        <span class="text-xs font-medium text-gray-500">Hasil Kas & Kegiatan RW</span>
        <div
          class="text-lg font-bold mt-1"
          :class="
            resumeData.iuran_warga.status === 'LABA'
              ? 'text-emerald-700'
              : 'text-rose-700'
          "
        >
          {{ formatCurrency(resumeData.iuran_warga.net_income) }}
        </div>
        <UBadge
          :color="resumeData.iuran_warga.status === 'LABA' ? 'success' : 'error'"
          variant="subtle"
          size="xs"
          class="mt-0.5 font-bold"
        >
          {{ resumeData.iuran_warga.status }}
        </UBadge>
      </div>

      <!-- Card 4: Kekayaan Bersih Akhir -->
      <div class="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 shadow-sm">
        <span class="text-xs font-medium text-blue-900">Kekayaan Bersih Akhir</span>
        <div class="text-lg font-bold text-blue-950 mt-1">
          {{ formatCurrency(resumeData.rekapitulasi_kekayaan.kekayaan_bersih_akhir) }}
        </div>
        <div class="text-[11px] text-blue-700 font-medium mt-0.5">
          Aset Bersih (Total Aset - Hutang)
        </div>
      </div>
    </div>

    <!-- Section 1: ESTATE MANAGEMENT -->
    <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div class="bg-amber-100/70 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between">
        <h3 class="text-sm font-bold text-amber-950 tracking-wide">
          1. ESTATE MANAGEMENT
        </h3>
        <UBadge
          :color="resumeData.estate_management.status === 'LABA' ? 'success' : 'error'"
          variant="solid"
          size="xs"
        >
          {{ resumeData.estate_management.status }}: {{ formatCurrency(resumeData.estate_management.net_income) }}
        </UBadge>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
              <th class="py-2 px-3 w-12 text-center border-r border-gray-200">No</th>
              <th class="py-2 px-4 w-36 border-r border-gray-200">Post</th>
              <th class="py-2 px-4 border-r border-gray-200">Uraian</th>
              <th colspan="2" class="py-1 px-4 text-center">Arus Kas</th>
            </tr>
            <tr class="bg-gray-50/70 border-b border-gray-200 text-gray-600 font-semibold text-[11px]">
              <th class="border-r border-gray-200"></th>
              <th class="border-r border-gray-200"></th>
              <th class="border-r border-gray-200"></th>
              <th class="py-1 px-4 w-44 text-right border-r border-gray-200">Masuk (Rp)</th>
              <th class="py-1 px-4 w-44 text-right">Keluar (Rp)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="item in resumeData.estate_management.items"
              :key="item.no"
              class="hover:bg-gray-50/50 transition-colors"
            >
              <td class="py-2 px-3 text-center border-r border-gray-100 text-gray-500 font-medium">
                {{ item.no }}
              </td>
              <td class="py-2 px-4 border-r border-gray-100 text-gray-600 font-medium">
                {{ item.post }}
              </td>
              <td class="py-2 px-4 border-r border-gray-100 text-gray-900 font-medium">
                {{ item.uraian }}
              </td>
              <td class="py-2 px-4 text-right font-mono border-r border-gray-100 text-gray-800">
                {{ formatNumber(item.masuk) }}
              </td>
              <td class="py-2 px-4 text-right font-mono text-gray-800">
                {{ formatNumber(item.keluar) }}
              </td>
            </tr>

            <!-- Total Row -->
            <tr class="bg-gray-50/80 font-bold border-t-2 border-gray-200 text-gray-900">
              <td colspan="3" class="py-2.5 px-4 text-center border-r border-gray-200 uppercase tracking-wide">
                Total
              </td>
              <td class="py-2.5 px-4 text-right font-mono text-emerald-700 border-r border-gray-200">
                {{ formatNumber(resumeData.estate_management.total_masuk) }}
              </td>
              <td class="py-2.5 px-4 text-right font-mono text-rose-700">
                {{ formatNumber(resumeData.estate_management.total_keluar) }}
              </td>
            </tr>

            <!-- Laba / Rugi Highlight Row -->
            <tr
              class="font-bold border-t border-gray-200 text-sm"
              :class="
                resumeData.estate_management.status === 'LABA'
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-rose-100 text-rose-900'
              "
            >
              <td colspan="3" class="py-2 px-4 text-right border-r border-gray-200 uppercase tracking-wide">
                Laba / (Rugi) EM
              </td>
              <td colspan="2" class="py-2 px-4 text-right font-mono text-base">
                {{ formatCurrency(resumeData.estate_management.net_income) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section 2: IURAN WARGA -->
    <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div class="bg-amber-100/70 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between">
        <h3 class="text-sm font-bold text-amber-950 tracking-wide">
          2. IURAN WARGA
        </h3>
        <UBadge
          :color="resumeData.iuran_warga.status === 'LABA' ? 'success' : 'error'"
          variant="solid"
          size="xs"
        >
          {{ resumeData.iuran_warga.status }}: {{ formatCurrency(resumeData.iuran_warga.net_income) }}
        </UBadge>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
              <th class="py-2 px-3 w-12 text-center border-r border-gray-200">No</th>
              <th class="py-2 px-4 w-36 border-r border-gray-200">Post</th>
              <th class="py-2 px-4 border-r border-gray-200">Uraian</th>
              <th colspan="2" class="py-1 px-4 text-center">Arus Kas</th>
            </tr>
            <tr class="bg-gray-50/70 border-b border-gray-200 text-gray-600 font-semibold text-[11px]">
              <th class="border-r border-gray-200"></th>
              <th class="border-r border-gray-200"></th>
              <th class="border-r border-gray-200"></th>
              <th class="py-1 px-4 w-44 text-right border-r border-gray-200">Masuk (Rp)</th>
              <th class="py-1 px-4 w-44 text-right">Keluar (Rp)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="item in resumeData.iuran_warga.items"
              :key="item.no"
              class="hover:bg-gray-50/50 transition-colors"
            >
              <td class="py-2 px-3 text-center border-r border-gray-100 text-gray-500 font-medium">
                {{ item.no }}
              </td>
              <td class="py-2 px-4 border-r border-gray-100 text-gray-600 font-medium">
                {{ item.post }}
              </td>
              <td class="py-2 px-4 border-r border-gray-100 text-gray-900 font-medium">
                {{ item.uraian }}
              </td>
              <td class="py-2 px-4 text-right font-mono border-r border-gray-100 text-gray-800">
                {{ formatNumber(item.masuk) }}
              </td>
              <td class="py-2 px-4 text-right font-mono text-gray-800">
                {{ formatNumber(item.keluar) }}
              </td>
            </tr>

            <!-- Total Row -->
            <tr class="bg-gray-50/80 font-bold border-t-2 border-gray-200 text-gray-900">
              <td colspan="3" class="py-2.5 px-4 text-center border-r border-gray-200 uppercase tracking-wide">
                Total
              </td>
              <td class="py-2.5 px-4 text-right font-mono text-emerald-700 border-r border-gray-200">
                {{ formatNumber(resumeData.iuran_warga.total_masuk) }}
              </td>
              <td class="py-2.5 px-4 text-right font-mono text-rose-700">
                {{ formatNumber(resumeData.iuran_warga.total_keluar) }}
              </td>
            </tr>

            <!-- Laba / Rugi Highlight Row -->
            <tr
              class="font-bold border-t border-gray-200 text-sm"
              :class="
                resumeData.iuran_warga.status === 'LABA'
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-rose-100 text-rose-900'
              "
            >
              <td colspan="3" class="py-2 px-4 text-right border-r border-gray-200 uppercase tracking-wide">
                Laba / (Rugi) Iuran Warga
              </td>
              <td colspan="2" class="py-2 px-4 text-right font-mono text-base">
                {{ formatCurrency(resumeData.iuran_warga.net_income) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section 3: REKAPITULASI KEKAYAAN BERSIH -->
    <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div class="bg-blue-100/70 border-b border-blue-200 px-4 py-2.5">
        <h3 class="text-sm font-bold text-blue-950 tracking-wide">
          3. REKAPITULASI KEKAYAAN BERSIH RW XI
        </h3>
      </div>

      <div class="p-4 space-y-3">
        <div class="space-y-2 text-xs">
          <!-- Row 1: Pendapatan Bersih Periode -->
          <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span class="font-semibold text-gray-700">Pendapatan Bersih Periode Berjalan (EM + Iuran Warga)</span>
            <span
              class="font-bold font-mono text-sm"
              :class="
                resumeData.rekapitulasi_kekayaan.pendapatan_bersih_status === 'LABA'
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              "
            >
              {{ formatCurrency(resumeData.rekapitulasi_kekayaan.pendapatan_bersih_periode) }}
            </span>
          </div>

          <!-- Row 2: Kekayaan Bersih Awal -->
          <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span class="font-semibold text-gray-700">{{ resumeData.rekapitulasi_kekayaan.kekayaan_bersih_awal_label }}</span>
            <span class="font-bold font-mono text-sm text-gray-900">
              {{ formatCurrency(resumeData.rekapitulasi_kekayaan.kekayaan_bersih_awal) }}
            </span>
          </div>

          <!-- Row 3: Kekayaan Bersih Akhir -->
          <div class="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <span class="font-bold text-emerald-950 text-sm">{{ resumeData.rekapitulasi_kekayaan.kekayaan_bersih_akhir_label }}</span>
            <span class="font-bold font-mono text-base text-emerald-900">
              {{ formatCurrency(resumeData.rekapitulasi_kekayaan.kekayaan_bersih_akhir) }}
            </span>
          </div>
        </div>

        <p class="text-[11px] text-gray-500 italic">
          * Keterangan: {{ resumeData.rekapitulasi_kekayaan.notes }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  body {
    background: #ffffff !important;
  }
}
</style>
