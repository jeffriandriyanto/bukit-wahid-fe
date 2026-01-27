<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
type AccentColor = 'primary' | 'success' | 'warning' | 'error' | 'neutral'

defineProps<{
  datasource: unknown
  accentColor?: AccentColor
}>()

// 1. Definisikan emits
const emit = defineEmits<{
  (e: 'nodeClick', node: any): void
  (e: 'nameClick', node: any): void
}>()

const borderColorClassMap: Record<AccentColor, string> = {
  primary: 'border-t-primary-600',
  success: 'border-t-green-600',
  warning: 'border-t-yellow-500',
  error: 'border-t-red-600',
  neutral: 'border-t-neutral-400'
}

const handleNodeClick = (node: any) => {
  emit('nodeClick', node)
}

const handleNameClick = (node: any) => {
  emit('nameClick', node)
}
</script>

<template>
  <OrganizationChart :datasource="datasource">
    <template #default="{ nodeData }">
      <div
        v-if="nodeData"
        class="flex items-center gap-4 min-w-max rounded-[10px] border-t-4 bg-white px-3 mx-4 py-2"
        :class="borderColorClassMap[accentColor ?? 'primary']"
        @click="handleNodeClick(nodeData)"
      >
        <UAvatar src="https://github.com/benjamincanac.png" size="sm" />

        <div class="flex flex-col gap-y-0.5 items-start">
          <span class="text-xs text-neutral-500 cursor-pointer">
            {{ nodeData?.title }}
          </span>
          <span
            class="text-sm font-semibold cursor-pointer hover:border-b-2"
            @click.stop="handleNameClick(nodeData)"
          >
            {{ nodeData?.name }}
          </span>
        </div>
      </div>
    </template>
  </OrganizationChart>
</template>

<style>
.chartOrgchartContainer,
.chartOrgchart {
  border: none !important;
}

.chartNode {
  border: none !important;
  background: transparent !important;
  margin-inline: 32px !important; /* SPACING SIBLING */
}

.chartNode:hover {
  box-shadow: none !important;
}
</style>
