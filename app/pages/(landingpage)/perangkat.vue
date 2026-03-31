<template>
  <UContainer class="py-12 space-y-8">
    <header
      class="w-full text-white mx-auto p-4 rounded-2xl bg-primary-600 border border-neutral-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
    >
      <div class="flex flex-col items-center gap-2">
        <h1 class="text-xl md:text-2xl font-bold uppercase tracking-wide">
          {{ managementData.page_title }}
        </h1>
        <p class="text-sm text-center leading-snug italic">
          "{{ managementData.page_subtitle }}"
        </p>
      </div>
    </header>

    <div
      v-if="rwDataList.length > 0"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8"
    >
      <div
        v-for="(member, index) in rwDataList"
        :key="index"
        class="group space-y-4 text-center"
      >
        <div
          class="aspect-3/4 overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 transition-all duration-300 group-hover:border-primary-500/50 group-hover:shadow-2xl group-hover:shadow-primary-500/10"
        >
          <img
            :src="member?.incumbent?.avatar"
            :alt="member.name"
            class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
          />
        </div>

        <div class="space-y-1">
          <h3
            class="text-neutral-800 font-bold text-sm md:text-base leading-tight transition-colors"
          >
            {{ member?.incumbent?.name }}
          </h3>
          <p
            class="text-neutral-500 text-xs uppercase font-medium tracking-wider"
          >
            {{ member.name }}
          </p>
        </div>
      </div>
    </div>

    <div class="max-w-xl mx-auto text-center pt-10">
      <p class="text-neutral-400 text-sm leading-relaxed">
        Struktur organisasi ini dibentuk berdasarkan hasil musyawarah warga demi
        mewujudkan lingkungan RW 11 yang lebih baik.
      </p>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { useRwStructure } from '~/composables/structure/useRwOrg'
const { rwDataList, fetchRwList } = useRwStructure()
const dataPerangkat = computed(() => rwDataList)

onMounted(fetchRwList)

const managementData = reactive({
  page_title: 'Pengurus RW.11',
  page_subtitle:
    'Jungle Toon Bukit Wahid Regency Manyaran Semarang Barat, Kota Semarang.'
})

definePageMeta({
  layout: 'landingpage'
})
</script>

<style scoped>
/* Menambahkan efek smooth pada gambar */
img {
  backface-visibility: hidden;
  -webkit-font-smoothing: subpixel-antialiased;
}
</style>
