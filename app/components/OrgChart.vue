<script setup lang="ts">
type AccentColor = 'primary' | 'success' | 'warning' | 'error' | 'neutral'

const props = defineProps<{
  datasource: unknown
  accentColor?: AccentColor
}>()

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

const accentHexMap: Record<AccentColor, string> = {
  primary: '#f56868',
  success: '#338e26', // green-600
  warning: '#eab308', // yellow-500
  error: '#dc2626', // red-600
  neutral: '#a3a3a3' // neutral-400
}

const currentAccentColor = computed(
  () => accentHexMap[props.accentColor ?? 'primary']
)

const handleNodeClick = (node: any) => {
  emit('nodeClick', node)
}

const handleNameClick = (node: any) => {
  emit('nameClick', node)
}

const getInitial = (name: string | null | undefined): string => {
  if (!name || name === 'Belum diisi' || name === '-') {
    return ''
  }

  const words = name.trim().split(/\s+/).filter(Boolean)

  const firstWord = words[0]
  if (!firstWord) return ''

  if (words.length >= 2) {
    const secondWord = words[1]
    return (firstWord.charAt(0) + (secondWord?.charAt(0) || '')).toUpperCase()
  }
  return firstWord.slice(0, 2).toUpperCase()
}
</script>

<template>
  <ClientOnly>
    <OrganizationChart :datasource="datasource">
      <template #default="{ nodeData }">
        <div
          v-if="nodeData"
          class="flex items-center gap-4 min-w-max rounded-[10px] border-t-4 bg-white px-3 mx-4 py-2"
          :class="borderColorClassMap[accentColor ?? 'primary']"
          @click="handleNodeClick(nodeData)"
        >
          <UAvatar
            size="sm"
            :text="getInitial(nodeData?.name)"
            :class="!getInitial(nodeData?.name) ? 'bg-gray-100' : ''"
          >
            <template v-if="!getInitial(nodeData?.name)" #default>
              <UIcon name="i-heroicons-user" class="text-gray-400" />
            </template>
          </UAvatar>

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
  </ClientOnly>
</template>

<style>
.chartOrgchartContainer,
.chartOrgchart {
  border: none !important;
}

.chartNode {
  border: none !important;
  background: transparent !important;
  margin-inline: 32px !important;
}

.chartNode:hover {
  box-shadow: none !important;
}

.orgchart .node::before,
.orgchart .nodes::before,
.orgchart .node .topEdge,
.orgchart .node .bottomEdge,
.orgchart .node .leftEdge,
.orgchart .node .rightEdge {
  background-color: v-bind(currentAccentColor) !important;
}

/* Garis Border (Border Color) */
.chartRightLine {
  border-right-color: v-bind(currentAccentColor) !important;
}
.chartLeftLine {
  border-left-color: v-bind(currentAccentColor) !important;
}
.chartTopLine {
  border-top-color: v-bind(currentAccentColor) !important;
}
.chartBottomLine {
  border-bottom-color: v-bind(currentAccentColor) !important;
}
.chartDownLine {
  background: v-bind(currentAccentColor) !important;
}

/* Style tambahan kamu yang lama tetap di sini */
.chartOrgchartContainer,
.chartOrgchart {
  border: none !important;
}

.chartNode {
  border: none !important;
  background: transparent !important;
  margin-inline: 32px !important;
  max-width: max-content !important;
}

.chartNode:hover {
  box-shadow: none !important;
}
</style>
