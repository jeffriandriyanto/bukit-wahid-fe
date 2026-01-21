<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

const emit = defineEmits(['update:open'])

const props = defineProps<{
  open: boolean
  data?: any
}>()

const processedCandidates = computed(() => {
  if (!props.open) return []

  const candidates = props.data?.candidate ? [...props.data.candidate] : []

  if (candidates.length > 0 && candidates.length < 3) {
    const dummyNames = [
      'Budi Santoso',
      'Siti Aminah',
      'Rudi Hermawan',
      // 'Dewi Lestari',
      // 'Agus Pratama'
    ]
    const needed = 6 - candidates.length
    for (let i = 0; i < needed; i++) {
      candidates.push({ name: dummyNames[i], poster: null, vision: 'Dummy' })
    }
  }

  return candidates
    .map((c: any) => ({
      name: c.name,
      poster:
        c.poster ||
        `https://ui-avatars.com/api/?name=${c.name}&background=random&color=fff`,
      votes:
        c.votes !== undefined ? c.votes : Math.floor(Math.random() * 90) + 10
    }))
    .sort((a: any, b: any) => b.votes - a.votes)
})

const chartOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
  xAxis: {
    type: 'category',
    data: processedCandidates.value.map((c: any) => c.name),
    axisLabel: { interval: 0, rotate: 30 }
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: 'Suara',
      type: 'bar',
      data: processedCandidates.value.map((c: any) => c.votes),
      itemStyle: { borderRadius: [5, 5, 0, 0], color: '#ef4444' },
      showBackground: true,
      backgroundStyle: { color: 'rgba(180, 180, 180, 0.1)' }
    }
  ]
}))

const columns = [
  {
    accessorKey: 'rank',
    header: 'Ranking'
  },
  {
    accessorKey: 'candidate',
    header: 'Kandidat'
  },
  {
    accessorKey: 'votes',
    header: 'Perolehan'
  }
]
</script>

<template>
  <UModal
    :open="open"
    @update:open="$emit('update:open', $event)"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h3 class="text-xl font-bold text-gray-900">Hasil Voting Terkini</h3>
          <p class="text-sm text-gray-500">
            {{ data?.title || 'Detail Suara' }}
          </p>
        </div>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          @click="$emit('update:open', false)"
        />
      </div>
    </template>

    <template #body>
      <div v-if="processedCandidates.length > 0" class="space-y-6">
        <div class="bg-gray-50 rounded-xl p-4 border border-gray-100 h-75">
          <VChart class="w-full" :option="chartOption" autoresize />
        </div>

        <div>
          <UTable
            :data="processedCandidates"
            :columns="columns"
            :ui="{
              base: 'border rounded-lg overflow-hidden',
              thead: 'bg-gray-50'
            }"
          >
            <template #rank-cell="{ row }">
              <div
                class="flex justify-center items-center w-8 h-8 rounded-full"
                :class="
                  index === 0
                    ? 'bg-yellow-100 text-yellow-700 font-bold border border-yellow-200'
                    : 'text-gray-500'
                "
              >
                {{ row.index + 1 }}
              </div>
            </template>

            <template #candidate-cell="{ row }">
              <div class="flex items-center gap-3">
                <UAvatar
                  :src="row.original.poster"
                  size="sm"
                  class="border shadow-sm"
                />
                <div class="flex flex-col">
                  <span class="font-semibold text-gray-900">{{
                    row.original.name
                  }}</span>
                  <span
                    v-if="index === 0"
                    class="text-[10px] text-yellow-600 font-bold uppercase tracking-wider"
                    >Unggul Sementara</span
                  >
                </div>
              </div>
            </template>

            <template #votes-cell="{ row }">
              <div
                class="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-md inline-block"
              >
                {{ row.original.votes }}
                <span class="text-xs font-normal text-gray-500">Suara</span>
              </div>
            </template>
          </UTable>
        </div>
      </div>

      <div
        v-else
        class="py-20 flex flex-col items-center justify-center text-gray-400"
      >
        <UIcon name="i-lucide-loader-2" class="animate-spin size-8 mb-2" />
        <p>Memuat hasil voting...</p>
      </div>
    </template>
  </UModal>
</template>
