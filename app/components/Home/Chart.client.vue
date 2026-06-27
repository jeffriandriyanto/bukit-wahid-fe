<script setup lang="ts">
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format } from 'date-fns'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

const props = defineProps<{
  period: any
  range: any
}>()

type DataRecord = { date: Date; amount: number }

const data = ref<DataRecord[]>([])

watch([() => props.period, () => props.range], () => {
  const dates = ({
    daily: eachDayOfInterval,
    weekly: eachWeekOfInterval,
    monthly: eachMonthOfInterval
  } as Record<Period, typeof eachDayOfInterval>)[props.period](props.range)

  const min = 1000
  const max = 10000

  data.value = dates.map((date) => ({
    date,
    amount: Math.floor(Math.random() * (max - min + 1)) + min
  }))
}, { immediate: true })

const total = computed(() =>
  data.value.reduce((acc: number, { amount }) => acc + amount, 0)
)

const formatNumber = new Intl.NumberFormat('en', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
}).format

const formatDateLabel = (date: Date): string => ({
  daily: format(date, 'd MMM'),
  weekly: format(date, 'd MMM'),
  monthly: format(date, 'MMM yyy')
})[props.period]

const chartOption = computed(() => ({
  grid: {
    left: 10,
    right: 15,
    top: 20,
    bottom: 5,
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: data.value.map((d, i) => {
      if (i === 0 || i === data.value.length - 1 || !data.value[i]) return ''
      return formatDateLabel(d.date)
    }),
    axisLine: { lineStyle: { color: '#e5e5e5' } },
    axisLabel: { color: '#a3a3a3', fontSize: 11 },
    axisTick: { show: false }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#e5e5e5', type: 'dashed' } },
    axisLabel: {
      color: '#a3a3a3',
      fontSize: 11,
      formatter: (val: number) =>
        val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val)
    }
  },
  tooltip: {
    trigger: 'axis',
    formatter: (params: any) => {
      const d = data.value[params[0]?.dataIndex]
      if (!d) return ''
      return `${formatDateLabel(d.date)}: ${formatNumber(d.amount)}`
    }
  },
  series: [
    {
      type: 'line',
      data: data.value.map((d) => d.amount),
      smooth: true,
      lineStyle: { color: '#fb261d', width: 2 },
      itemStyle: { color: '#fb261d' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(251,38,29,0.25)' },
            { offset: 1, color: 'rgba(251,38,29,0.02)' }
          ]
        }
      },
      showSymbol: false
    }
  ]
}))
</script>

<template>
  <UCard
    :ui="{ root: 'bg-white rounded overflow-visible', body: '!px-0 !pt-0 !pb-3' }"
  >
    <template #header>
      <div>
        <p class="text-xs uppercase mb-1.5">Revenue</p>
        <p class="text-3xl text-highlighted font-semibold">
          {{ formatNumber(total) }}
        </p>
      </div>
    </template>

    <div class="h-96 w-full">
      <v-chart :option="chartOption" autoresize />
    </div>
  </UCard>
</template>
