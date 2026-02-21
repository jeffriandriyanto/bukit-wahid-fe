<template>
  <UContainer class="py-12 md:py-20 space-y-12">
    <header
      class="text-center text-white p-4 max-w-3xl mx-auto space-y-2 bg-linear-to-r from-primary-600 via-primary-400 to-primary-600 rounded-2xl"
    >
      <h1 class="text-xl md:text-3xl font-black tracking-tight">
        {{ managementData.page_title }}
      </h1>
      <p class="text-sm">{{ managementData.page_subtitle }}</p>
    </header>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
      <div
        v-for="(member, index) in managementData.members"
        :key="index"
        class="group space-y-4 text-center"
      >
        <div
          class="aspect-3/4 overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 transition-all duration-300 group-hover:border-primary-500/50 group-hover:shadow-2xl group-hover:shadow-primary-500/10"
        >
          <img
            :src="member.photo"
            :alt="member.name"
            class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
          />
        </div>

        <div class="space-y-1">
          <h3
            class="text-neutral-800 font-bold text-sm md:text-base leading-tight transition-colors"
          >
            {{ member.name }}
          </h3>
          <p
            class="text-neutral-500 text-xs uppercase font-medium tracking-wider"
          >
            {{ member.role }}
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
definePageMeta({
  layout: 'landingpage'
})

// Data Variable (Siap diisi dari fetch API)
const managementData = reactive({
  page_title: 'Pengurus RW.11',
  page_subtitle:
    'Jungle Toon Bukit Wahid Regency Manyaran Semarang Barat, Kota Semarang.',
  members: [
    {
      name: 'Sri Wiharnanto',
      role: 'Ketua RW',
      photo: 'https://i.pravatar.cc/400?u=sri'
    },
    {
      name: 'Berlia Adi Nata',
      role: 'Sekretaris',
      photo: 'https://i.pravatar.cc/400?u=berlia'
    },
    {
      name: 'Fajar Pambudi',
      role: 'Bendahara I',
      photo: 'https://i.pravatar.cc/400?u=fajar'
    },
    {
      name: 'Budi Chandra',
      role: 'Bendahara II',
      photo: 'https://i.pravatar.cc/400?u=budi'
    },
    {
      name: 'Riris Very Sulistiyani',
      role: 'Seksi Umum',
      photo: 'https://i.pravatar.cc/400?u=riris'
    },
    {
      name: 'Vita Nurhapsari',
      role: 'Seksi Pemberdayaan',
      photo: 'https://i.pravatar.cc/400?u=vita'
    },
    {
      name: 'Herlina Putri',
      role: 'Seksi Sosial',
      photo: 'https://i.pravatar.cc/400?u=herlina'
    }
  ]
})
</script>

<style scoped>
/* Menambahkan efek smooth pada gambar */
img {
  backface-visibility: hidden;
  -webkit-font-smoothing: subpixel-antialiased;
}
</style>
