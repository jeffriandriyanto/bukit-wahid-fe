<template>
  <div class="bg-neutral-50/50 min-h-screen pb-24 overflow-hidden">
    <SharedLandingHeader
      badge="Bagan Organisasi"
      title="Struktur"
      highlight="Kepengurusan"
      :subtitle="profileData.subtitle"
    />

    <UContainer class="py-4">
      <div
        v-if="rwData"
        class="relative bg-white border border-neutral-100 shadow-premium rounded-[3rem] p-8 md:p-16 overflow-x-auto intersect-once intersect:animate-fade-in-up"
      >
        <div class="absolute top-8 right-8 flex items-center gap-2 text-neutral-400">
          <UIcon name="i-lucide-mouse-pointer-2" class="w-4 h-4" />
          <span class="text-[10px] font-black uppercase tracking-widest italic">Geser untuk melihat detail</span>
        </div>

        <div class="min-w-max flex justify-center py-10">
          <OrgChart :datasource="rwData" />
        </div>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-32 space-y-4"
      >
        <UIcon name="i-lucide-loader-2" class="w-10 h-10 text-primary-500 animate-spin" />
        <p class="text-sm text-neutral-400 font-bold uppercase tracking-[0.2em] animate-pulse">
          Menyusun Bagan Organisasi...
        </p>
      </div>

      <div class="max-w-2xl mx-auto text-center pt-20 border-t border-neutral-200 mt-16">
        <p class="text-neutral-400 text-xs leading-relaxed font-medium italic">
          "Bagan ini merepresentasikan alur koordinasi dan tanggung jawab setiap bidang untuk pelayanan warga Bukit Wahid Regency yang lebih terukur."
        </p>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { useRwStructure } from '~/composables/structure/useRwOrg'

const { rwData, fetchRw } = useRwStructure()

useSeoMeta({
  title: 'Struktur Organisasi RW 11 - Bukit Wahid Regency',
  description: 'Visualisasi alur koordinasi dan tanggung jawab pengurus RW 11 Bukit Wahid Regency.',
  ogImage: '/images/landingpage.png'
})

const profileData = reactive({
  subtitle: 'Alur koordinasi transparan demi mewujudkan lingkungan yang harmonis dan terorganisir.'
})

definePageMeta({
  layout: 'landingpage'
})

onMounted(() => {
  fetchRw()
})
</script>
