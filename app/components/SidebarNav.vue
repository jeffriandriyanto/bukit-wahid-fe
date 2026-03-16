<script setup lang="ts">
import type { SidebarItem } from '~/types/sidebar'

defineProps<{
  items: SidebarItem[]
}>()

const route = useRoute()

const isActive = (to?: string) => {
  if (!to) return false
  return route.path === to
}

const isChildActive = (item: SidebarItem) => {
  return item.children?.some((child) => route.path === child.to)
}

const openSubMenus = ref<Record<string, boolean>>({})
const toggleSubMenu = (label: string) => {
  openSubMenus.value[label] = !openSubMenus.value[label]
}
</script>

<template>
  <nav class="flex flex-col gap-2">
    <div v-for="item in items" :key="item.label">
      <template v-if="!item.isHide">
        <div v-if="item.children" class="flex flex-col gap-1">
          <button
            class="group flex w-full items-center justify-between rounded-xl px-4 py-3 transition hover:bg-neutral-800 text-neutral-300 hover:text-white"
            :class="{ 'text-white': isChildActive(item) }"
            @click="toggleSubMenu(item.label)"
          >
            <div class="flex items-center gap-3">
              <UIcon :name="item.icon" class="h-5 w-5 shrink-0" />
              <span class="text-sm font-medium">{{ item.label }}</span>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="h-4 w-4 transition-transform"
              :class="{
                'rotate-90': openSubMenus[item.label] || isChildActive(item)
              }"
            />
          </button>

          <div
            v-if="openSubMenus[item.label] || isChildActive(item)"
            class="ml-9 flex flex-col gap-1 border-l border-neutral-800 pl-2"
          >
            <template v-for="child in item.children" :key="child.to">
              <NuxtLink
                v-if="!child.isHide"
                :to="child.to"
                class="rounded-lg px-4 py-2 text-sm transition"
                :class="
                  isActive(child.to)
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                "
              >
                {{ child.label }}
              </NuxtLink>
            </template>
          </div>
        </div>

        <NuxtLink
          v-else
          :to="item.to"
          class="group flex items-center gap-3 rounded-xl px-4 py-3 transition"
          :class="
            isActive(item.to)
              ? 'bg-primary-600 text-white shadow-md'
              : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
          "
        >
          <UIcon :name="item.icon" class="h-5 w-5 shrink-0" />
          <span class="text-sm font-medium">{{ item.label }}</span>
        </NuxtLink>
      </template>
    </div>
  </nav>
</template>
