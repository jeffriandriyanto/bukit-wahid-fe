<template>
  <UContainer class="py-12 space-y-12">
    <header
      class="max-w-3xl mx-auto p-8 rounded-2xl bg-neutral-50/50 border border-neutral-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
    >
      <div class="flex flex-col items-center gap-2">
        <div class="w-12 h-1 bg-primary-500 rounded-full mb-2"></div>

        <h1
          class="text-xl md:text-2xl font-bold text-neutral-800 uppercase tracking-wide"
        >
          {{ profileData.title }}
        </h1>
        <p class="text-neutral-500 text-sm text-center leading-snug italic">
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
