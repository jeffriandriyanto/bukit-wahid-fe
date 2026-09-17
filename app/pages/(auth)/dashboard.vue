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
const rawData = ref<any>(null) // Penampung data mentah dari API

// --- API ACTIONS ---
const fetchDashboardData = async () => {
  try {
    const res = await useApi('/dashboard')
    if (res.status === 1) {
      rawData.value = res.data
    }
  } catch (err) {
    console.error('Gagal mengambil data dashboard:', err)
  } finally {
    loading.value = false
  }
}

// --- MAPPING DATA UNTUK UI ---
const stats = computed(() => ({
  total_citizens: rawData.value?.total_resident || 0,
  total_houses: rawData.value?.total_residence || 0,
  app_users: rawData.value?.total_user || 0
}))

const financialData = computed(() => ({
  in: rawData.value?.balance?.this_month_income || 0,
  out: rawData.value?.balance?.this_month_outcome || 0,
  balance: rawData.value?.balance?.total_balance || 0
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
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="(fin, idx) in [
            {
              label: 'Pemasukan Bulan Ini',
              val: financialData.in,
              bg: 'bg-gradient-to-br from-secondary-500 to-secondary-700',
              icon: 'i-lucide-trending-up'
            },
            {
              label: 'Pengeluaran Bulan Ini',
              val: financialData.out,
              bg: 'bg-gradient-to-br from-primary-500 to-primary-700',
              icon: 'i-lucide-trending-down'
            },
            {
              label: 'Total Saldo',
              val: financialData.balance,
              bg: 'bg-gradient-to-br from-neutral-800 to-neutral-950',
              icon: 'i-lucide-wallet',
              isBalance: true
            }
          ]"
          :key="idx"
          class="relative overflow-hidden p-8 rounded-[2.5rem] text-white shadow-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-xl"
          :class="fin.bg"
        >
          <div class="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div class="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5 blur-xl" />
          <div class="relative z-10">
            <div class="flex items-center gap-2 mb-4">
              <div class="p-2 rounded-xl bg-white/15 backdrop-blur-sm">
                <UIcon :name="fin.icon" class="w-5 h-5" />
              </div>
              <p class="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em]">
                {{ fin.label }}
              </p>
            </div>
            <p
              class="text-3xl font-black tabular-nums"
              :class="fin.isBalance ? 'text-secondary-400' : ''"
            >
              {{ formatCurrencyCompact(fin.val) }}
            </p>
            <p class="text-[11px] opacity-50 mt-1.5 tabular-nums">
              {{ formatCurrency(fin.val) }}
            </p>
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
          <v-chart :option="ageChartOption" autoresize />
        </div>
      </UCard>

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
