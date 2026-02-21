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

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div class="lg:col-span-8 space-y-8">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2 font-bold text-primary-500">
              <UIcon name="i-lucide-map-pin" />
              BAB I : Data Umum Wilayah
            </div>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="(val, key) in generalInfoMap" :key="key" class="space-y-1">
              <p class="text-xs text-neutral-800 uppercase font-semibold tracking-wider">{{ key }}</p>
              <p class="text-neutral-600">{{ val }}</p>
            </div>
            <div class="md:col-span-2 pt-4 border-t border-neutral-800">
              <div class="text-xs text-neutral-500 uppercase font-semibold mb-3">Batas Wilayah</div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-neutral-700">
                <div v-for="(v, k) in profileData.sections.general.boundaries" :key="k" class="bg-neutral-100 p-3 rounded-lg border border-neutral-800">
                  <p class="text-[10px] uppercase font-bold mb-2">{{ k }}</p>
                  <p class="text-xs">{{ v }}</p>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <UCard>
            <template #header>
              <div class="font-bold text-primary-500 flex items-center gap-2">
                <UIcon name="i-lucide-users" /> BAB II : Demografi
              </div>
            </template>
            <div class="space-y-4">
              <div class="flex justify-between items-end border-b border-neutral-800 pb-2">
                <span class="text-sm text-neutral-800">Total Kepala Keluarga</span>
                <span class="text-xl font-bold">{{ profileData.sections.demographics.total_households }} KK</span>
              </div>
              <div class="space-y-2">
                <div v-for="age in profileData.sections.demographics.age_groups" :key="age.label" class="flex justify-between text-sm">
                  <span class="text-neutral-800">{{ age.label }}</span>
                  <span class="text-neutral-600 font-mono">{{ age.value }} Orang</span>
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="font-bold text-primary-500 flex items-center gap-2">
                <UIcon name="i-lucide-component" /> BAB IV : Potensi
              </div>
            </template>
            <div class="space-y-4">
              <div>
                <div class="text-xs text-neutral-800 mb-2 uppercase">Fasilitas Umum</div>
                <div class="flex flex-wrap gap-2">
                  <UBadge v-for="f in profileData.sections.assets_activities.facilities" :key="f" color="neutral" variant="subtle" size="md">
                    {{ f }}
                  </UBadge>
                </div>
              </div>
              <div>
                <div class="text-xs text-neutral-800 mb-2 uppercase">Kegiatan Rutin</div>
                <ul class="text-sm text-neutral-600 list-disc list-inside space-y-1">
                  <li v-for="act in profileData.sections.assets_activities.routine_activities" :key="act">{{ act }}</li>
                </ul>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <div class="lg:col-span-4 space-y-8">
        <div class="aspect-3/4 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 group">
          <img
            src="https://i.pravatar.cc/400?u=berlia"
            alt="Sri Wihananto - Ketua RW"
            class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          />
        </div>

        <UCard>
          <template #header>
            <div class="font-bold text-primary-500 flex items-center gap-2">
              <UIcon name="i-lucide-sitemap" /> BAB III : Pengurus
            </div>
          </template>
          <div class="space-y-4">
            <div v-for="member in profileData.sections.organization" :key="member.role">
              <p class="text-[10px] uppercase text-primary font-black tracking-tighter">{{ member.role }}</p>
              <p class="font-medium transition-colors">{{ member.name }}</p>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <div class="pt-12 border-t border-neutral-800 text-center">
      <p class="text-neutral-500 italic text-sm">"{{ profileData.sections.closing }}"</p>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'landingpage'
})

// Mock data dari backend (Sesuai gambar)
const profileData = reactive({
  title: "Profil RW.11",
  subtitle: "Jungle Toon Bukit Wahid Regency Manyaran Semarang Barat, Kota Semarang.",
  sections: {
    general: {
      kelurahan: "Manyaran",
      kecamatan: "Semarang Barat",
      kota: "Semarang",
      boundaries: {
        Utara: "RW 1 dan RW 2",
        Selatan: "RW 6",
        Timur: "RW 12",
        Barat: "RW 5"
      },
      area_size: "± 178.000 m²",
      total_rt: "7 (RT 001 sampai RT 007)"
    },
    demographics: {
      total_households: 50,
      total_residents: 120,
      age_groups: [
        { label: "Balita (0-4)", value: 14 },
        { label: "Anak (5-12)", value: 29 },
        { label: "Dewasa (18-59)", value: 28 },
        { label: "Lansia (>60)", value: 3 }
      ]
    },
    organization: [
      { role: "Pelindung", name: "Lurah Manyaran Ibu Kanti" },
      { role: "Penasihat", name: "Majelis Musyawarah RW" },
      { role: "Ketua RW", name: "Sri Wihananto" },
      { role: "Sekretaris", name: "Berlia Adi Nata" },
      { role: "Bendahara I", name: "Fajar Pambudi" },
      { role: "Bendahara II", name: "Budi Chandra" }
    ],
    assets_activities: {
      facilities: ["Masjid", "Kolam Renang Jungle Toon", "Lapangan Bulu Tangkis", "Taman"],
      routine_activities: ["Pengajian rutin", "Peringatan HUT RI", "Halal bihalal", "Acara Keagamaan"]
    },
    closing: "Demikian Profil RW 11 Bukit Wahid Regency, semoga bermanfaat bagi kita semua"
  }
})

// Helper untuk mapping data umum agar template lebih bersih
const generalInfoMap = computed(() => ({
  'Kelurahan': profileData.sections.general.kelurahan,
  'Kecamatan': profileData.sections.general.kecamatan,
  'Kota': profileData.sections.general.kota,
  'Luas Wilayah': profileData.sections.general.area_size,
  'Jumlah RT': profileData.sections.general.total_rt
}))
</script>
