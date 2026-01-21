<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

definePageMeta({
  middleware: ['auth']
})

const tabs = [
  { label: 'Kartu Keluarga', slot: 'family_card' },
  { label: 'Rumah', slot: 'home' }
] satisfies TabsItem[]
</script>

<template>
  <div>
    <UTabs
      :items="tabs"
      variant="link"
      class="mb-6 w-full"
      :ui="{
        label: 'text-md group-data-[state=inactive]:text-black min-w-full',
        indicator: 'h-1 bg-primary-600',
        list: 'px-0'
      }"
    >
      <template #family_card>
        <MasterDataFamilyCard />
      </template>
      <template #home>
        <MasterDataHome />
      </template>
    </UTabs>
  </div>
</template>
