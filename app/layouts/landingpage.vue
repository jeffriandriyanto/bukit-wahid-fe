<template>
  <div>
    <UHeader
      :ui="{
        root: 'bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50'
      }"
    >
      <template #left>
        <NuxtLink to="/" class="flex items-center gap-2">
          <AppLogoWhite class="w-auto h-6 shrink-0" />
        </NuxtLink>
      </template>

      <UNavigationMenu
        :items="navigationItems"
        content-orientation="vertical"
      />

      <template #right>
        <div class="flex items-center gap-2">
          <UButton
            to="/login"
            color="neutral"
            variant="ghost"
            class="text-white hover:bg-neutral-800"
          >
            Masuk
          </UButton>
        </div>
      </template>
    </UHeader>

    <UMain>
      <slot />
    </UMain>
  </div>
</template>

<script setup lang="ts">
// Menggunakan icon dari Lucide (i-lucide-*) adalah standar Nuxt UI v4
const navigationItems = [
  {
    label: 'Profil',
    to: '/profile',
    icon: 'i-lucide-user',
  },
  {
    label: 'Layanan',
    icon: 'i-lucide-layout-grid',
    children: [
      {
        label: 'Program Kerja',
        to: '/program',
        icon: 'i-lucide-clipboard-list',
      },
      {
        label: 'Pembangunan',
        to: '/renbang',
        icon: '',
      },
      {
        label: 'Agenda & Galeri',
        to: '/agenda',
        icon: 'i-lucide-calendar-days'
      },
      { label: 'Berita', to: '/berita', icon: 'i-lucide-newspaper' },
      { label: 'Unit Usaha', to: '/usaha', icon: 'i-lucide-store' }
    ]
  },
  {
    label: 'Warga',
    icon: 'i-lucide-users',
    children: [
      {
        label: 'Data Warga',
        to: '/warga/data',
        icon: 'i-lucide-database',
        description: 'Sensus dan pendataan penduduk.'
      },
      {
        label: 'Iuran Kas',
        to: '/warga/kas',
        icon: 'i-lucide-wallet',
        description: 'Transparansi laporan keuangan.'
      },
      {
        label: 'Surat Pengantar',
        to: '/warga/surat',
        icon: 'i-lucide-file-text'
      }
    ]
  },
  {
    label: 'Informasi',
    icon: 'i-lucide-info',
    children: [
      {
        label: 'Pengumuman',
        to: '/informasi/pengumuman',
        icon: 'i-lucide-megaphone'
      },
      {
        label: 'Peraturan RW',
        to: '/informasi/peraturan',
        icon: 'i-lucide-gavel'
      },
      {
        label: 'Kontak Darurat',
        to: '/informasi/phone-call',
        icon: 'i-lucide-phone-forwarded'
      }
    ]
  },
  {
    label: 'Statistik',
    icon: 'i-lucide-bar-chart-3',
    children: [
      {
        label: 'Demografi',
        to: '/statistik/demografi',
        icon: 'i-lucide-pie-chart'
      },
      {
        label: 'Pekerjaan',
        to: '/statistik/pekerjaan',
        icon: 'i-lucide-briefcase'
      },
      {
        label: 'Pendidikan',
        to: '/statistik/pendidikan',
        icon: 'i-lucide-graduation-cap'
      }
    ]
  }
]
</script>
