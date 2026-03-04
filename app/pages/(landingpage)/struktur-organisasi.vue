<template>
  <UContainer class="py-12 space-y-8">
    <header
      class="w-full text-white mx-auto p-4 rounded-2xl bg-primary-600 border border-neutral-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
    >
      <div class="flex flex-col items-center gap-2">
        <h1 class="text-xl md:text-2xl font-bold uppercase tracking-wide">
          {{ profileData.title }}
        </h1>
        <p class="text-sm text-center leading-snug italic">
          "{{ profileData.subtitle }}"
        </p>
      </div>
    </header>

    <div v-if="rwData" class="w-full flex justify-center">
      <OrgChart :datasource="rwData" />
    </div>
    <div
      v-else
      class="loading text-sm text-neutral-400 italic text-center py-8"
    >
      Memuat Struktur RW...
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { useRwStructure } from '~/composables/structure/useRwOrg'
import OrgChart from '~/components/OrgChart.vue'

const { rwData, fetchRw } = useRwStructure()

const profileData = reactive({
  title: 'Struktur Organisasi',
  subtitle:
    'Jungle Toon Bukit Wahid Regency Manyaran Semarang Barat, Kota Semarang.'
})

definePageMeta({
  layout: 'landingpage'
})

onMounted(() => {
  fetchRw()
})
</script>
