<script setup lang="ts">
// [SEO Update]
const title = 'Profil & Demografi RW 11 Bukit Wahid Regency'
const description =
  'Informasi geografis wilayah, statistik penduduk, dan potensi lingkungan RW 11 Bukit Wahid Regency, Semarang.'

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  ogImage: '/images/landingpage.png',
  twitterCard: 'summary_large_image'
})

definePageMeta({
  layout: 'landingpage'
})

const profileData = reactive({
  sections: {
    general: {
      kelurahan: 'Manyaran',
      kecamatan: 'Semarang Barat',
      kota: 'Semarang',
      boundaries: {
        Utara: 'RW 1 dan RW 2',
        Selatan: 'RW 6',
        Timur: 'RW 12',
        Barat: 'RW 5'
      },
      area_size: '± 178.000 m²',
      total_rt: '7 (RT 001 sampai RT 007)'
    },
    demographics: {
      total_households: 50,
      total_residents: 120,
      age_groups: [
        { label: 'Balita (0-4)', value: 14, color: 'bg-blue-400' },
        { label: 'Anak (5-12)', value: 29, color: 'bg-primary-400' },
        { label: 'Dewasa (18-59)', value: 28, color: 'bg-amber-400' },
        { label: 'Lansia (>60)', value: 3, color: 'bg-rose-400' }
      ]
    },
    assets_activities: {
      facilities: [
        'Masjid',
        'Kolam Renang Jungle Toon',
        'Lapangan Bulu Tangkis',
        'Taman'
      ],
      routine_activities: [
        'Pengajian rutin',
        'Peringatan HUT RI',
        'Halal bihalal',
        'Acara Keagamaan'
      ]
    },
    closing:
      'Demikian Profil RW 11 Bukit Wahid Regency, semoga bermanfaat bagi kita semua.'
  }
})

const generalInfoMap = computed(() => ({
  Kelurahan: profileData.sections.general.kelurahan,
  Kecamatan: profileData.sections.general.kecamatan,
  Kota: profileData.sections.general.kota,
  'Luas Wilayah': profileData.sections.general.area_size,
  'Jumlah RT': profileData.sections.general.total_rt
}))
</script>

<template>
  <div class="bg-neutral-50/50 min-h-screen pb-20 overflow-hidden">
    <SharedLandingHeader
      badge="Informasi Publik"
      title="Profil &"
      highlight="Statistik"
      subtitle="Data komprehensif mengenai wilayah, penduduk, dan potensi lingkungan Bukit Wahid Regency."
    />

    <UContainer class="py-4">
      <div class="max-w-5xl mx-auto space-y-12">
        <UCard
          class="overflow-hidden border-none shadow-premium intersect-once intersect:animate-fade-in-up"
          :ui="{ body: 'p-0' }"
        >
          <div class="bg-primary-600 p-8 flex items-center gap-4">
            <div class="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <UIcon name="i-lucide-map-pin" class="w-8 h-8 text-white" />
            </div>
            <div>
              <span
                class="block text-white/70 text-xs font-black uppercase tracking-[0.2em]"
                >Wilayah Administrasi</span
              >
              <span class="font-black text-2xl text-white tracking-tight"
                >Geografis Wilayah</span
              >
            </div>
          </div>

          <div class="p-10 space-y-12">
            <div
              class="grid grid-cols-2 md:grid-cols-5 gap-8 text-center md:text-left"
            >
              <div
                v-for="(val, key) in generalInfoMap"
                :key="key"
                class="space-y-1 group"
              >
                <p
                  class="text-[10px] text-primary-500 uppercase font-black tracking-widest"
                >
                  {{ key }}
                </p>
                <p
                  class="text-neutral-900 font-extrabold text-lg group-hover:text-primary-600 transition-colors"
                >
                  {{ val }}
                </p>
              </div>
            </div>

            <!-- <div class="border-neutral-100">
              <div class="flex items-center gap-4 mb-8">
                <div class="h-px flex-1 bg-neutral-100"></div>
                <p
                  class="text-[10px] text-neutral-400 uppercase font-black tracking-[0.3em]"
                >
                  Batas Administrasi
                </p>
                <div class="h-px flex-1 bg-neutral-100"></div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div
                  v-for="(v, k) in profileData.sections.general.boundaries"
                  :key="k"
                  class="bg-neutral-50/50 p-6 rounded-[2rem] border border-neutral-100 text-center hover:bg-white hover:shadow-xl hover:border-primary-100 transition-all duration-500 group"
                >
                  <p
                    class="text-[10px] text-neutral-400 uppercase font-black mb-3 group-hover:text-primary-500 transition-colors tracking-widest"
                  >
                    {{ k }}
                  </p>
                  <p class="text-base font-black text-neutral-800">{{ v }}</p>
                </div>
              </div>
            </div> -->
          </div>
        </UCard>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <UCard
            class="border-none shadow-premium rounded-[2.5rem] intersect-once intersect:animate-fade-in-up"
          >
            <template #header>
              <div
                class="font-black text-neutral-900 flex items-center gap-3 text-xl tracking-tight"
              >
                <div class="p-2 bg-primary-50 rounded-xl">
                  <UIcon
                    name="i-lucide-users"
                    class="text-primary-600 w-6 h-6"
                  />
                </div>
                Statistik Penduduk
              </div>
            </template>
            <div class="space-y-10">
              <div
                class="bg-neutral-900 p-8 rounded-[2rem] flex justify-between items-center shadow-lg relative overflow-hidden group"
              >
                <div
                  class="absolute inset-0 bg-primary-600 opacity-0 group-hover:opacity-10 transition-opacity"
                ></div>
                <span
                  class="text-sm font-bold text-neutral-400 uppercase tracking-widest"
                  >Total Keluarga</span
                >
                <div class="text-right z-10">
                  <span class="text-4xl font-black text-white leading-none">{{
                    profileData.sections.demographics.total_households
                  }}</span>
                  <span
                    class="text-xs font-bold text-primary-500 ml-2 uppercase"
                    >KK</span
                  >
                </div>
              </div>
              <div class="space-y-5">
                <div
                  v-for="age in profileData.sections.demographics.age_groups"
                  :key="age.label"
                  class="space-y-2"
                >
                  <div
                    class="flex justify-between text-[10px] font-black uppercase tracking-widest"
                  >
                    <span class="text-neutral-500">{{ age.label }}</span>
                    <span class="text-neutral-900">{{ age.value }} Jiwa</span>
                  </div>
                  <div
                    class="h-3 w-full bg-neutral-100 rounded-full overflow-hidden"
                  >
                    <div
                      class="h-full rounded-full transition-all duration-1000 ease-out"
                      :class="age.color"
                      :style="{ width: (age.value / 40) * 100 + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <UCard
            class="border-none shadow-premium rounded-[2.5rem] intersect-once intersect:animate-fade-in-up"
          >
            <template #header>
              <div
                class="font-black text-neutral-900 flex items-center gap-3 text-xl tracking-tight"
              >
                <div class="p-2 bg-primary-50 rounded-xl">
                  <UIcon
                    name="i-lucide-component"
                    class="text-primary-600 w-6 h-6"
                  />
                </div>
                Potensi Wilayah
              </div>
            </template>
            <div class="space-y-8">
              <div>
                <div
                  class="text-[10px] text-neutral-400 mb-5 uppercase font-black tracking-[0.2em] flex items-center gap-3"
                >
                  Fasilitas Umum
                  <div class="h-px flex-1 bg-neutral-100"></div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="f in profileData.sections.assets_activities
                      .facilities"
                    :key="f"
                    color="neutral"
                    variant="subtle"
                    class="rounded-xl font-black px-4 py-2 text-[10px] uppercase border border-neutral-200 hover:border-primary-300 transition-colors"
                    >{{ f }}</UBadge
                  >
                </div>
              </div>
              <div class="pt-8 border-t border-neutral-100">
                <div
                  class="text-[10px] text-neutral-400 mb-5 uppercase font-black tracking-[0.2em] flex items-center gap-3"
                >
                  Agenda Rutin
                  <div class="h-px flex-1 bg-neutral-100"></div>
                </div>
                <div class="grid grid-cols-1 gap-3">
                  <div
                    v-for="act in profileData.sections.assets_activities
                      .routine_activities"
                    :key="act"
                    class="flex items-center gap-4 text-xs font-black text-neutral-700 bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100 group hover:border-primary-200 transition-all hover:bg-white"
                  >
                    <div
                      class="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(var(--color-primary-500),0.5)]"
                    ></div>
                    {{ act }}
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <div
        class="mt-24 pt-12 border-t border-neutral-200 text-center animate-fade-in-up"
      >
        <UIcon
          name="i-lucide-quote"
          class="text-primary-500 w-12 h-12 mx-auto mb-8 opacity-20"
        />
        <p
          class="text-3xl font-serif text-neutral-400 italic max-w-3xl mx-auto leading-relaxed"
        >
          "{{ profileData.sections.closing }}"
        </p>
      </div>
    </UContainer>
  </div>
</template>
