<script setup lang="ts">
import type { SidebarItem } from '~/types/sidebar'

defineProps<{
  items: SidebarItem[]
}>()

const route = useRoute()

const isActive = (to: string) => {
  return route.path === to
}
</script>

<template>
  <nav class="flex flex-col gap-2 px-3">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="group flex items-center gap-3 rounded-xl px-4 py-3 transition"
      :class="isActive(item.to)
        ? 'bg-primary-600 text-white shadow-md'
        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'"
    >
      <UIcon
        :name="item.icon"
        class="h-5 w-5 shrink-0"
      />

      <span class="text-sm font-medium">
        {{ item.label }}
      </span>
    </NuxtLink>
  </nav>
</template>
