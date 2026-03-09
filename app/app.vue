<script setup lang="ts">
import { id } from '@nuxt/ui/locale'
const locale = id

const pageData = reactive({
  hero: {
    title: 'RW 11 Bukit Wahid Regency',
    highlight: 'Wahid',
    location:
      'Kelurahan Manyaran, Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah.',
    secretariat: 'Sekretariat: Jungle Toon Bukit Wahid Regency, Manyaran',
    bgImage: '/images/landingpage.png',
    whatsapp: 'https://wa.me/628123456789',
    email: 'admin@bukitwahid.com'
  }
})

useSeoMeta({
  title: `${pageData.hero.title} - Portal Resmi Warga`,
  ogTitle: `${pageData.hero.title} - Portal Resmi Warga`,
  description: pageData.hero.location,
  ogDescription: `Selamat datang di portal informasi resmi ${pageData.hero.title}. Dapatkan informasi pengumuman dan agenda kegiatan terbaru di lingkungan kami.`,
  ogImage: pageData.hero.bgImage,
  twitterCard: 'summary_large_image',
  ogUrl: 'https://rw11bukitwahid.com'
})
</script>

<template>
  <NuxtLayout>
    <UApp :locale="locale">
      <NuxtPage />
    </UApp>
  </NuxtLayout>
</template>
