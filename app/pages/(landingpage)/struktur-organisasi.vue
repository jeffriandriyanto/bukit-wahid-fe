<template>
  <UContainer class="py-12 md:py-20 space-y-12">
    <header
      class="text-center text-white p-4 max-w-3xl mx-auto space-y-2 bg-linear-to-r from-primary-600 via-primary-400 to-primary-600 rounded-2xl"
    >
      <h1 class="text-xl md:text-3xl font-black tracking-tight">
        {{ profileData.title }}
      </h1>
      <p class="text-sm">{{ profileData.subtitle }}</p>
    </header>

    <div v-if="rwData">
      <OrgChart :datasource="rwData" />
    </div>
    <div v-else class="loading text-sm text-neutral-400 italic text-center py-8">
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
