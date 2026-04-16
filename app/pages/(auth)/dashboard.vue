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

// Register ECharts components
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
const loading = ref(false)
const financialData = ref({
  in: 0,
  out: 0,
  balance: 0
})

const stats = ref({
  total_citizens: 1240,
  total_houses: 450,
  app_users: 890
})

// --- API ACTIONS ---
const fetchDashboardData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/finance/journal/data')
    if (res.status === 1) {
      financialData.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch financial stats:', err)
  } finally {
    loading.value = false
  }
}

// --- CHART CONFIGURATIONS (Theme Adjusted) ---

// 1. Grafik Usia (Bar Chart - Pakai warna Secondary/Hijau)
const ageChartOption = ref({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: [
      'Tdk Diketahui',
      '0-5 thn',
      '6-12 thn',
      '13-16 thn',
      '17-21 thn',
      '22-40 thn',
      '41-59 thn',
      '>=60 thn'
    ],
    axisLabel: { fontSize: 10, color: '#737373' }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { type: 'dashed', color: '#e5e5e5' } }
  },
  series: [
    {
      data: [12, 85, 120, 90, 145, 410, 275, 103],
      type: 'bar',
      itemStyle: { color: '#43b433', borderRadius: [4, 4, 0, 0] }, // Secondary-500
      barWidth: '50%'
    }
  ]
})

// 2. Grafik Agama (Pie Chart - Mix Primary & Secondary)
const religionChartOption = ref({
  tooltip: { trigger: 'item' },
  legend: {
    bottom: '0',
    left: 'center',
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { fontSize: 10, color: '#737373' }
  },
  color: ['#a3a3a3', '#43b433', '#fb261d', '#338e26', '#d31b13', '#fb6967'], // Mix Neutral, Secondary, Primary
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: 5, name: 'Tidak diketahui' },
        { value: 850, name: 'Islam' },
        { value: 150, name: 'Kristen' },
        { value: 120, name: 'Katolik' },
        { value: 30, name: 'Hindu' },
        { value: 20, name: 'Budha' }
      ]
    }
  ]
})

// 3. Grafik Jenis Kelamin (Doughnut Chart)
const genderChartOption = ref({
  tooltip: { trigger: 'item' },
  legend: {
    top: 'middle',
    right: '5%',
    orient: 'vertical',
    textStyle: { fontSize: 11, color: '#737373' }
  },
  series: [
    {
      name: 'Jenis Kelamin',
      type: 'pie',
      radius: ['50%', '85%'],
      center: ['40%', '50%'],
      label: { show: false },
      data: [
        { value: 640, name: 'Laki-laki', itemStyle: { color: '#338e26' } }, // Secondary-600
        { value: 600, name: 'Perempuan', itemStyle: { color: '#fb6967' } } // Primary-400
      ]
    }
  ]
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val)
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard class="border-none shadow-sm ring-1 ring-neutral-200 rounded-4xl">
        <div class="flex items-center gap-4">
          <div
            class="p-3 bg-secondary-50 rounded-2xl text-secondary-600 font-bold"
          >
            <UIcon name="i-lucide-users" class="w-8 h-8" />
          </div>
          <div>
            <p
              class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest"
            >
              Jumlah Warga
            </p>
            <p class="text-2xl font-black text-neutral-900">
              {{ stats.total_citizens }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="border-none shadow-sm ring-1 ring-neutral-200 rounded-4xl">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-primary-50 rounded-2xl text-primary-600">
            <UIcon name="i-lucide-home" class="w-8 h-8" />
          </div>
          <div>
            <p
              class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest"
            >
              Jumlah Rumah
            </p>
            <p class="text-2xl font-black text-neutral-900">
              {{ stats.total_houses }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="border-none shadow-sm ring-1 ring-neutral-200 rounded-4xl">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-neutral-100 rounded-2xl text-neutral-600">
            <UIcon name="i-lucide-smartphone" class="w-8 h-8" />
          </div>
          <div>
            <p
              class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest"
            >
              Pengguna Aplikasi
            </p>
            <p class="text-2xl font-black text-neutral-900">
              {{ stats.app_users }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard
        class="bg-secondary-600 text-white border-none shadow-lg shadow-secondary-100 rounded-4xl"
      >
        <p
          class="text-[10px] font-bold text-secondary-100 uppercase tracking-[0.2em] mb-1"
        >
          Pemasukan Bulan Ini
        </p>
        <p class="text-2xl font-black">
          {{ formatCurrency(financialData.in) }}
        </p>
      </UCard>

      <UCard
        class="bg-primary-600 text-white border-none shadow-lg shadow-primary-100 rounded-4xl"
      >
        <p
          class="text-[10px] font-bold text-primary-100 uppercase tracking-[0.2em] mb-1"
        >
          Pengeluaran Bulan Ini
        </p>
        <p class="text-2xl font-black">
          {{ formatCurrency(financialData.out) }}
        </p>
      </UCard>

      <UCard
        class="bg-neutral-900 text-white border-none shadow-lg shadow-neutral-200 rounded-4xl"
      >
        <p
          class="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-1"
        >
          Total Saldo
        </p>
        <p class="text-2xl font-black text-secondary-400">
          {{ formatCurrency(financialData.balance) }}
        </p>
      </UCard>
    </div>

    <UCard class="border-none shadow-sm ring-1 ring-neutral-200 rounded-4xl">
      <template #header>
        <h3 class="font-bold text-neutral-800 italic uppercase tracking-tight">
          Grafik Jumlah Warga (Berdasarkan Usia)
        </h3>
      </template>
      <div class="h-75 w-full">
        <v-chart :option="ageChartOption" autoresize />
      </div>
    </UCard>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UCard class="border-none shadow-sm ring-1 ring-neutral-200 rounded-4xl">
        <template #header>
          <h3
            class="font-bold text-neutral-800 italic uppercase tracking-tight"
          >
            Jumlah Berdasarkan Agama
          </h3>
        </template>
        <div class="h-70 w-full">
          <v-chart :option="religionChartOption" autoresize />
        </div>
      </UCard>

      <UCard class="border-none shadow-sm ring-1 ring-neutral-200 rounded-4xl">
        <template #header>
          <h3
            class="font-bold text-neutral-800 italic uppercase tracking-tight"
          >
            Jumlah Berdasarkan Jenis Kelamin
          </h3>
        </template>
        <div class="h-70 w-full">
          <v-chart :option="genderChartOption" autoresize />
        </div>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.echarts {
  width: 100%;
  height: 100%;
}
</style>
