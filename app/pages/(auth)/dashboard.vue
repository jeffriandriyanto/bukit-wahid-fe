<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import {
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  BarChart,
  PieChart,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

definePageMeta({ middleware: ['auth'] })

// --- STATE ---
const loading = ref(true)
const error = ref(false)
const rawData = ref<any>(null) // Penampung data mentah dari API

// --- AGE GROUP DETAIL MODAL ---
const isOpenAgeDetail = ref(false)
const selectedAgeGroup = ref('')
const loadingAgeDetail = ref(false)
const ageDetailData = ref<any[]>([])

// --- API ACTIONS ---
const fetchDashboardData = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await useApi('/dashboard')
    if (res.status === 1) {
      rawData.value = res.data
    }
  } catch (err) {
    console.error('Gagal mengambil data dashboard:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

const fetchAgeGroupDetail = async (ageGroup: string) => {
  loadingAgeDetail.value = true
  selectedAgeGroup.value = ageGroup
  isOpenAgeDetail.value = true
  ageDetailData.value = []

  try {
    const res = await useApi('/dashboard/age-group-detail', {
      params: { age_group: ageGroup }
    })
    if (res.status === 1) {
      ageDetailData.value = res.data
    }
  } catch (err) {
    console.error('Gagal mengambil detail usia:', err)
  } finally {
    loadingAgeDetail.value = false
  }
}

const isEmpty = computed(() => {
  if (!rawData.value) return true
  return (
    (rawData.value.total_resident || 0) === 0 &&
    (rawData.value.total_residence || 0) === 0 &&
    (rawData.value.total_user || 0) === 0
  )
})

// --- MAPPING DATA UNTUK UI ---
const stats = computed(() => ({
  total_citizens: rawData.value?.total_resident || 0,
  total_houses: rawData.value?.total_residence || 0,
  app_users: rawData.value?.total_user || 0
}))

const financialData = computed(() => ({
  in: rawData.value?.balance?.this_month_income || 0,
  out: rawData.value?.balance?.this_month_outcome || 0,
  balance: rawData.value?.balance?.total_balance || 0,
  cash_in_hand: rawData.value?.balance?.cash_in_hand || 0,
  bank_mandiri: rawData.value?.balance?.bank_mandiri || 0,
}))

// --- CHART CONFIGURATIONS ---
const chartBaseConfig = {
  animationDuration: 1500,
  animationEasing: 'cubicOut' as any
}

// 1. Grafik Usia (Dinamis dari resident_by_age_group)
const ageChartOption = computed(() => {
  const ageGroup = rawData.value?.resident_by_age_group || {}
  return {
    ...chartBaseConfig,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: Object.keys(ageGroup),
      axisLine: { lineStyle: { color: '#e5e5e5' } },
      axisLabel: { color: '#a3a3a3', fontSize: 10 }
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
    series: [
      {
        data: Object.values(ageGroup),
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#43b433' },
              { offset: 1, color: '#338e26' }
            ]
          },
          borderRadius: [6, 6, 0, 0]
        },
        barWidth: '40%'
      }
    ]
  }
})

// Handle chart click
const onAgeChartClick = (params: any) => {
  const ageGroupKeys = Object.keys(rawData.value?.resident_by_age_group || {})
  if (params.dataIndex !== undefined && ageGroupKeys[params.dataIndex]) {
    fetchAgeGroupDetail(ageGroupKeys[params.dataIndex])
  }
}

// 2. Grafik Agama (Dinamis dari resident_by_religion)
const religionChartOption = computed(() => {
  const religionData = rawData.value?.resident_by_religion || {}
  const chartData = Object.entries(religionData)
    .filter(([_, val]) => (val as number) > 0) // Hanya tampilkan yang ada datanya
    .map(([name, value]) => ({ name, value }))

  return {
    ...chartBaseConfig,
    tooltip: { trigger: 'item' },
    legend: { bottom: '0', icon: 'circle', textStyle: { fontSize: 10 } },
    color: [
      '#338e26',
      '#fb6967',
      '#fb261d',
      '#facc15',
      '#3b82f6',
      '#8b5cf6',
      '#a3a3a3'
    ],
    series: [
      {
        type: 'pie',
        radius: ['45%', '75%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 4 },
        label: { show: false },
        data: chartData
      }
    ]
  }
})

// 3. Grafik Jenis Kelamin (Dinamis dari resident_by_gender)
const genderChartOption = computed(() => {
  const genderData = rawData.value?.resident_by_gender || {}
  return {
    ...chartBaseConfig,
    tooltip: { trigger: 'item' },
    legend: { top: 'middle', right: '5%', orient: 'vertical', icon: 'circle' },
    series: [
      {
        name: 'Jenis Kelamin',
        type: 'pie',
        radius: ['55%', '80%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: [
          {
            value: genderData['Laki-laki'] || 0,
            name: 'Laki-laki',
            itemStyle: { color: '#338e26' }
          },
          {
            value: genderData['Perempuan'] || 0,
            name: 'Perempuan',
            itemStyle: { color: '#fb6967' }
          }
        ]
      }
    ]
  }
})

const totalAgeDetail = computed(() => {
  return ageDetailData.value.reduce((sum, item) => sum + item.total, 0)
})

onMounted(() => fetchDashboardData())
</script>

<template>
  <div class="p-1 space-y-8 animate-in fade-in duration-700">
    <!-- LOADING STATE (Optional but recommended) -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-primary-600"
      />
    </div>

    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center h-64 gap-4"
    >
      <UIcon name="i-lucide-alert-triangle" class="w-10 h-10 text-red-400" />
      <p class="text-gray-500 text-sm">Gagal memuat data dashboard.</p>
      <UButton
        label="Coba Lagi"
        color="primary"
        variant="outline"
        size="sm"
        @click="fetchDashboardData()"
      />
    </div>

    <div
      v-else-if="isEmpty"
      class="flex flex-col items-center justify-center h-64 gap-4"
    >
      <UIcon name="i-lucide-database" class="w-10 h-10 text-gray-300" />
      <p class="text-gray-500 text-sm">Belum ada data untuk ditampilkan.</p>
    </div>

    <template v-else>
      <!-- TOP STATS -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="(stat, idx) in [
            {
              label: 'Jumlah Warga',
              val: stats.total_citizens,
              icon: 'i-lucide-users',
              color: 'secondary'
            },
            {
              label: 'Jumlah Rumah',
              val: stats.total_houses,
              icon: 'i-lucide-home',
              color: 'primary'
            },
            {
              label: 'Pengguna App',
              val: stats.app_users,
              icon: 'i-lucide-smartphone',
              color: 'neutral'
            }
          ]"
          :key="idx"
          class="group relative overflow-hidden bg-white p-6 rounded-[2.5rem] ring-1 ring-neutral-200/80 shadow-sm hover:shadow-lg hover:ring-neutral-300 transition-all duration-500"
        >
          <div
            class="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500"
            :class="`bg-${stat.color}-500`"
          />
          <div class="flex items-center gap-5 relative z-10">
            <div
              :class="[
                `p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 group-hover:shadow-lg transition-all duration-500`
              ]"
            >
              <UIcon :name="stat.icon" class="w-8 h-8" />
            </div>
            <div>
              <p
                class="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]"
              >
                {{ stat.label }}
              </p>
              <p class="text-3xl font-black text-neutral-900 tabular-nums">
                {{ stat.val }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- FINANCIAL CARDS -->
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="(fin, idx) in [
              {
                label: '💵 Kas Fisik (Tunai)',
                val: financialData.cash_in_hand,
                bg: 'bg-gradient-to-br from-emerald-600 to-teal-800',
                icon: 'i-lucide-banknote',
                badge: 'Brankas RW'
              },
              {
                label: '🏦 Bank Mandiri',
                val: financialData.bank_mandiri,
                bg: 'bg-gradient-to-br from-blue-600 to-indigo-800',
                icon: 'i-lucide-landmark',
                badge: 'Rekening RW'
              },
              {
                label: '💰 Total Kas & Bank',
                val: financialData.balance,
                bg: 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950',
                icon: 'i-lucide-wallet',
                isBalance: true,
                badge: 'Likuiditas'
              }
            ]"
            :key="idx"
            class="relative overflow-hidden p-7 rounded-[2.5rem] text-white shadow-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-xl"
            :class="fin.bg"
          >
            <div class="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div class="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5 blur-xl" />
            <div class="relative z-10">
              <div class="flex items-center justify-between gap-2 mb-4">
                <div class="flex items-center gap-2">
                  <div class="p-2 rounded-xl bg-white/15 backdrop-blur-sm">
                    <UIcon :name="fin.icon" class="w-5 h-5" />
                  </div>
                  <p class="text-[11px] font-bold opacity-85 uppercase tracking-[0.15em]">
                    {{ fin.label }}
                  </p>
                </div>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                  {{ fin.badge }}
                </span>
              </div>
              <p
                class="text-3xl font-black tabular-nums"
                :class="fin.isBalance ? 'text-secondary-400' : ''"
              >
                {{ formatCurrencyCompact(fin.val) }}
              </p>
              <p class="text-[11px] opacity-70 mt-1.5 tabular-nums">
                {{ formatCurrency(fin.val) }}
              </p>
            </div>
          </div>
        </div>

        <!-- MONTHLY CASHFLOW MINI CARDS -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center justify-between p-4 px-6 rounded-2xl bg-secondary-50/70 border border-secondary-100 ring-1 ring-secondary-200/50">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-secondary-500 text-white shadow-sm">
                <UIcon name="i-lucide-trending-up" class="w-4 h-4" />
              </div>
              <div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-secondary-800">
                  Pemasukan Bulan Ini
                </p>
                <p class="text-lg font-black text-secondary-900 tabular-nums">
                  {{ formatCurrency(financialData.in) }}
                </p>
              </div>
            </div>
            <span class="text-xs font-semibold text-secondary-700 bg-secondary-100 px-2.5 py-1 rounded-lg">
              {{ formatCurrencyCompact(financialData.in) }}
            </span>
          </div>

          <div class="flex items-center justify-between p-4 px-6 rounded-2xl bg-red-50/70 border border-red-100 ring-1 ring-red-200/50">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-red-500 text-white shadow-sm">
                <UIcon name="i-lucide-trending-down" class="w-4 h-4" />
              </div>
              <div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-red-800">
                  Pengeluaran Bulan Ini
                </p>
                <p class="text-lg font-black text-red-900 tabular-nums">
                  {{ formatCurrency(financialData.out) }}
                </p>
              </div>
            </div>
            <span class="text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-lg">
              {{ formatCurrencyCompact(financialData.out) }}
            </span>
          </div>
        </div>
      </div>

      <!-- MAIN CHART -->
      <UCard
        class="relative border-none shadow-xl ring-1 ring-neutral-200/80 rounded-[3rem] overflow-hidden"
      >
        <div class="absolute top-0 right-0 w-40 h-40 bg-secondary-500/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <template #header>
          <div class="flex items-center justify-between px-2">
            <h3
              class="font-black text-neutral-800 uppercase tracking-tighter flex items-center gap-2 text-lg"
            >
              <div class="w-2 h-6 bg-secondary-500 rounded-full" />
              Distribusi Usia Warga
            </h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-expand"
              size="xs"
            />
          </div>
        </template>
        <div class="h-80 w-full px-2">
          <v-chart
            :option="ageChartOption"
            autoresize
            @click="onAgeChartClick"
          />
        </div>
      </UCard>

      <!-- AGE GROUP DETAIL MODAL -->
      <UModal v-model:open="isOpenAgeDetail" :ui="{ content: 'max-w-lg' }">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-users" class="text-primary-600" />
            <span class="font-bold text-gray-900">
              Detail Usia: {{ selectedAgeGroup }}
            </span>
          </div>
        </template>

        <template #body>
          <div v-if="loadingAgeDetail" class="py-10 text-center">
            <UIcon
              name="i-lucide-loader-circle"
              class="w-6 h-6 text-gray-300 animate-spin mx-auto"
            />
            <p class="text-sm text-gray-500 mt-2">Memuat data...</p>
          </div>

          <div v-else-if="ageDetailData.length === 0" class="py-10 text-center">
            <UIcon
              name="i-lucide-database"
              class="w-10 h-10 text-gray-300 mx-auto mb-2"
            />
            <p class="text-gray-500 text-sm">Tidak ada data untuk kelompok usia ini.</p>
          </div>

          <div v-else class="space-y-3">
            <div class="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
              <span class="text-sm font-medium text-gray-600">Total Warga</span>
              <span class="text-2xl font-black text-primary-600">{{ totalAgeDetail }}</span>
            </div>

            <div class="border rounded-xl overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">RT</th>
                    <th class="text-right px-4 py-3 font-semibold text-gray-600">Jumlah</th>
                    <th class="text-right px-4 py-3 font-semibold text-gray-600">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in ageDetailData"
                    :key="index"
                    class="border-t hover:bg-gray-50 transition-colors"
                  >
                    <td class="px-4 py-3 font-medium text-gray-900">{{ item.rt }}</td>
                    <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ item.total }}</td>
                    <td class="px-4 py-3 text-right text-gray-600">
                      {{ totalAgeDetail > 0 ? ((item.total / totalAgeDetail) * 100).toFixed(1) : 0 }}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <template #footer>
          <UButton
            label="Tutup"
            color="neutral"
            variant="ghost"
            @click="isOpenAgeDetail = false"
          />
        </template>
      </UModal>

      <!-- SECONDARY CHARTS -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UCard
          v-for="(chart, idx) in [
            { title: 'Persentase Agama', option: religionChartOption },
            { title: 'Rasio Jenis Kelamin', option: genderChartOption }
          ]"
          :key="idx"
          class="border-none shadow-lg ring-1 ring-neutral-200/80 rounded-[2.5rem] hover:shadow-xl transition-shadow duration-500"
        >
          <template #header>
            <h3
              class="font-bold text-neutral-700 text-sm uppercase tracking-widest px-2"
            >
              {{ chart.title }}
            </h3>
          </template>
          <div class="h-72 w-full">
            <v-chart :option="chart.option" autoresize />
          </div>
        </UCard>
      </div>
    </template>
  </div>
</template>

<style scoped>
.echarts {
  width: 100%;
  height: 100%;
}
</style>
