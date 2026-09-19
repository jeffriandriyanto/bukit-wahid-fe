<template>
  <div class="bg-neutral-50/50 min-h-screen pb-24">
    <SharedLandingHeader
      badge="Struktur Organisasi"
      title="Jajaran"
      highlight="Pengurus"
      :subtitle="managementData.page_subtitle"
    />

    <UContainer class="py-12">
      <div v-if="rwDataList.length > 0" class="space-y-20">
        <div
          v-intersect class="flex justify-center"
        >
          <div
            v-for="leader in leaderData"
            :key="leader.name"
            class="group max-w-sm w-full text-center space-y-6"
          >
            <div class="relative p-2">
              <div
                class="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              ></div>

              <div
                class="aspect-[3/4] overflow-hidden rounded-[3rem] bg-neutral-100 border-4 border-white shadow-2xl relative z-10 group-hover:border-primary-50 transition-colors duration-700"
              >
                <NuxtImg
                  v-if="leader?.incumbent?.avatar"
                  :src="leader.incumbent.avatar"
                  :alt="leader?.incumbent?.name || 'Ketua'"
                  class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                  loading="eager"
                  format="avif,webp"
                />
                <div v-else class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-neutral-300 group-hover:text-primary-300 transition-all duration-700">
                  <UIcon name="i-heroicons-user" class="w-32 h-32 opacity-75 group-hover:scale-110 transition-transform duration-700" />
                </div>
              </div>
            </div>
            <div class="space-y-2 relative z-10">
              <p
                class="text-primary-600 text-xs font-black uppercase tracking-[0.3em]"
              >
                {{ leader.name }}
              </p>
              <h3
                class="text-3xl font-black text-neutral-900 tracking-tighter uppercase italic"
                :class="!leader?.incumbent?.name ? 'opacity-50' : ''"
              >
                {{ leader?.incumbent?.name || 'Belum Ditunjuk' }}
              </h3>
              <div class="w-12 h-1 bg-primary-500 mx-auto rounded-full"></div>
            </div>
          </div>
        </div>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12"
        >
          <div
            v-for="(member, index) in staffData"
            :key="index"
            v-intersect class="group space-y-5 text-center"
            :style="{ 'animation-delay': index * 0.1 + 's' }"
          >
            <div class="relative px-4">
              <div
                class="aspect-[3/4] overflow-hidden rounded-[2.5rem] bg-neutral-100 border border-neutral-200 transition-all duration-500 group-hover:border-primary-200 group-hover:shadow-premium-hover group-hover:-translate-y-2"
              >
                <NuxtImg
                  v-if="member?.incumbent?.avatar"
                  :src="member.incumbent.avatar"
                  :alt="member?.incumbent?.name || 'Pengurus'"
                  class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  format="avif,webp"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 text-neutral-300 group-hover:text-primary-300 transition-all duration-500">
                  <UIcon name="i-heroicons-user" class="w-20 h-20 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                </div>
              </div>
            </div>

            <div class="space-y-1">
              <p
                class="text-primary-500 text-[10px] uppercase font-black tracking-[0.2em]"
              >
                {{ member.name }}
              </p>
              <h3
                class="text-neutral-900 font-extrabold text-lg tracking-tight group-hover:text-primary-600 transition-colors"
                :class="!member?.incumbent?.name ? 'opacity-50 text-base italic' : ''"
              >
                {{ member?.incumbent?.name || 'Belum Ditunjuk' }}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div
        class="max-w-2xl mx-auto text-center pt-20 border-t border-neutral-200 mt-20"
      >
        <UIcon name="i-lucide-info" class="w-8 h-8 text-primary-500/20 mb-4" />
        <p class="text-neutral-500 text-sm leading-relaxed italic font-medium">
          "Struktur organisasi ini dibentuk berdasarkan hasil musyawarah mufakat
          warga demi mewujudkan tata kelola lingkungan RW 11 yang transparan,
          akuntabel, dan harmonis."
        </p>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { useRwStructure } from '~/composables/structure/useRwOrg'
const { rwDataList, fetchRwList } = useRwStructure()

// [SEO]
useSeoMeta({
  title: 'Jajaran Pengurus RW 11 - Bukit Wahid Regency',
  description:
    'Kenali lebih dekat pengurus lingkungan RW 11 Bukit Wahid Regency yang berdedikasi melayani warga.',
  ogImage: '/images/landingpage.png'
})

// [Logic] Memisahkan Ketua dari Staff untuk Hierarchy
const leaderData = computed(() => {
  return rwDataList.value.filter((m) =>
    m.name.toLowerCase().includes('ketua rw')
  )
})

const staffData = computed(() => {
  return rwDataList.value.filter(
    (m) => !m.name.toLowerCase().includes('ketua rw')
  )
})

onMounted(fetchRwList)

const managementData = reactive({
  page_title: 'Pengurus RW.11',
  page_subtitle:
    'Dedikasi melayani dan mengayomi warga Bukit Wahid Regency dengan semangat transparansi.'
})

definePageMeta({
  layout: 'landingpage'
})
</script>
