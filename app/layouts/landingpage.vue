<template>
  <div class="min-h-screen flex flex-col bg-neutral-950">
    <UHeader
      :ui="{
        root: 'bg-neutral-900/80 backdrop-blur border-b border-neutral-800 sticky top-0 z-50',
        container: 'max-w-7xl'
      }"
      :toggle="false"
    >
      <template #left>
        <NuxtLink to="/" class="hover:opacity-80 transition-opacity">
          <AppLogoWhite class="w-auto h-6" />
        </NuxtLink>
      </template>

      <UNavigationMenu :items="navigationItems" class="hidden lg:flex" />

      <template #right>
        <UButton
          :to="loginTarget"
          :label="loginLabel"
          color="neutral"
          :icon="loginIcon"
          class="font-bold hidden sm:flex"
        />

        <UButton
          icon="i-lucide-menu"
          color="neutral"
          variant="ghost"
          class="lg:hidden"
          @click="isMobileMenuOpen = true"
        />
      </template>
    </UHeader>

    <USlideover v-model:open="isMobileMenuOpen" title="Menu Navigasi">
      <template #content>
        <div class="p-4 flex flex-col h-full bg-neutral-900">
          <div class="flex items-center justify-between mb-8">
            <AppLogoWhite class="w-auto h-5" />
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              @click="isMobileMenuOpen = false"
            />
          </div>

          <div class="space-y-6 overflow-y-auto grow">
            <div
              v-for="item in navigationItems"
              :key="item.label"
              class="space-y-3"
            >
              <div
                class="flex items-center gap-2 text-primary-500 font-bold px-2 uppercase text-xs tracking-widest"
              >
                <UIcon :name="item.icon" v-if="item.icon" />
                {{ item.label }}
              </div>

              <div class="flex flex-col gap-1 ml-2">
                <template v-if="item.children">
                  <NuxtLink
                    v-for="child in item.children"
                    :key="child.to"
                    :to="child.to"
                    class="flex flex-col p-3 rounded-lg hover:bg-neutral-800 transition-colors group"
                    @click="isMobileMenuOpen = false"
                  >
                    <div
                      class="flex items-center gap-3 text-white font-semibold"
                    >
                      <UIcon
                        :name="child.icon"
                        class="text-neutral-500 group-hover:text-primary-500"
                      />
                      {{ child.label }}
                    </div>
                    <p class="text-xs text-neutral-500 mt-1 ml-7">
                      {{ child.description }}
                    </p>
                  </NuxtLink>
                </template>
                <template v-else>
                  <NuxtLink
                    :to="item.to"
                    class="flex items-center gap-3 p-3 rounded-lg text-white font-semibold hover:bg-neutral-800 transition-colors"
                    @click="isMobileMenuOpen = false"
                  >
                    <UIcon :name="item.icon" class="text-neutral-500" />
                    {{ item.label }}
                  </NuxtLink>
                </template>
              </div>
            </div>
          </div>

          <div class="pt-6 border-t border-neutral-800 space-y-4">
            <UButton
              :to="loginTarget"
              :label="loginLabel"
              :icon="loginIcon"
              block
              color="primary"
              size="lg"
              @click="isMobileMenuOpen = false"
            />
          </div>
        </div>
      </template>
    </USlideover>

    <UMain class="bg-white">
      <slot />
    </UMain>

    <footer class="bg-black border-t border-neutral-800 pt-16 pb-8">
      <UContainer>
        <div class="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          <div class="md:col-span-5 space-y-6">
            <AppLogoWhite class="w-auto h-7" />
            <p class="text-neutral-400 leading-relaxed max-w-sm text-sm">
              Sistem Informasi Pelayanan Warga RW 11 Bukit Wahid Regency.
              Mewujudkan lingkungan yang transparan, modern, dan terkoneksi.
            </p>
            <div class="flex gap-3 mt-4">
              <UButton
                v-for="soc in socials"
                :key="soc.label"
                :to="soc.link"
                :icon="soc.icon"
                color="neutral"
                variant="subtle"
                class="rounded-full hover:text-primary-500 transition-colors"
                :aria-label="soc.label"
              />
            </div>
          </div>

          <div class="md:col-span-3 space-y-4">
            <h4
              class="font-semibold text-white uppercase tracking-wider text-sm"
            >
              Alamat
            </h4>
            <address class="text-neutral-400 text-sm not-italic leading-6">
              {{ CONFIG.location }}<br />
              <span class="text-neutral-500 mt-2 block font-medium">{{
                CONFIG.secretariat
              }}</span>
            </address>
          </div>

          <div class="md:col-span-4 space-y-4">
            <h4
              class="font-semibold text-primary-500 uppercase tracking-wider text-sm"
            >
              Hubungi Kami
            </h4>
            <ul class="space-y-3">
              <li>
                <UButton
                  :to="CONFIG.whatsapp"
                  icon="i-lucide-message-circle"
                  label="WhatsApp Admin"
                  variant="ghost"
                  color="neutral"
                  class="-ml-2.5 text-neutral-400 hover:text-white"
                />
              </li>
              <li>
                <UButton
                  :to="`mailto:${CONFIG.email}`"
                  icon="i-lucide-mail"
                  :label="CONFIG.email"
                  variant="ghost"
                  color="neutral"
                  class="-ml-2.5 text-neutral-400 hover:text-white"
                />
              </li>
            </ul>
          </div>
        </div>

        <div
          class="pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-500"
        >
          <p class="text-xs font-medium">
            &copy; {{ new Date().getFullYear() }} RW 11 Bukit Wahid Regency
            Semarang.
          </p>
          <nav class="flex gap-6">
            <NuxtLink
              to="/privacy"
              class="text-xs hover:text-primary-500 transition-colors uppercase font-bold tracking-widest"
              >Privacy Policy</NuxtLink
            >
            <NuxtLink
              to="/terms"
              class="text-xs hover:text-primary-500 transition-colors uppercase font-bold tracking-widest"
              >Terms</NuxtLink
            >
          </nav>
        </div>
      </UContainer>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Ambil token secara reactive dari useAuth
const { token } = useAuth()

const isMobileMenuOpen = ref(false)
const loginTarget = computed(() => (token.value ? '/dashboard' : '/login'))
const loginLabel = computed(() => (token.value ? 'Dashboard' : 'Masuk'))
const loginIcon = computed(() =>
  token.value ? 'i-lucide-layout-dashboard' : 'i-lucide-log-in'
)

const CONFIG = {
  location:
    'Kelurahan Manyaran, Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah.',
  secretariat: 'Sekretariat: Jungle Toon Bukit Wahid Regency, Manyaran',
  whatsapp: 'https://wa.me/628123456789',
  email: 'admin@bukitwahid.com'
}

// Logic Computed untuk Tombol Auth
const authButton = computed(() => {
  return token.value
    ? {
        label: 'Dashboard',
        to: '/dashboard',
        icon: 'i-lucide-layout-dashboard'
      }
    : { label: 'Masuk', to: '/login', icon: 'i-lucide-log-in' }
})

const socials = [
  {
    icon: 'i-simple-icons-instagram',
    link: 'https://instagram.com/daily.jeds',
    label: 'Instagram'
  },
  { icon: 'i-simple-icons-youtube', link: '#', label: 'YouTube' },
  { icon: 'i-simple-icons-facebook', link: '#', label: 'Facebook' },
  { icon: 'i-simple-icons-tiktok', link: '#', label: 'TikTok' }
]

const navigationItems = [
  {
    label: 'Profil',
    icon: 'i-lucide-building-2',
    description: 'Kenali lebih dekat lingkungan dan pengurus RW 11.',
    children: [
      {
        label: 'Profil Umum',
        to: '/profil',
        icon: 'i-lucide-info',
        description: 'Visi, misi, dan sejarah Bukit Wahid Regency.'
      },
      {
        label: 'Struktur Organisasi',
        to: '/struktur-organisasi',
        icon: 'i-lucide-network',
        description: 'Bagan kepengurusan dan tupoksi pengurus.'
      },
      {
        label: 'Perangkat RW 11',
        to: '/perangkat',
        icon: 'i-lucide-users',
        description: 'Daftar Ketua RT dan seksi-seksi bidang.'
      }
    ]
  },
  {
    label: 'Program Kerja',
    to: '/program',
    icon: 'i-lucide-clipboard-check',
    description: 'Transparansi rencana dan realisasi kegiatan tahunan.'
  },
  {
    label: 'Layanan Warga',
    icon: 'i-lucide-shrub',
    description: 'Pusat informasi dan dokumentasi kegiatan lingkungan.',
    children: [
      {
        label: 'Agenda',
        to: '/warga/agenda',
        icon: 'i-lucide-calendar-clock',
        description: 'Jadwal pertemuan dan kegiatan mendatang.'
      },
      {
        label: 'Iuran Kas',
        to: '/warga/kas',
        icon: 'i-lucide-receipt-japanese-yen', // atau i-lucide-banknote
        description: 'Pantau laporan keuangan kas secara transparan.'
      },
      {
        label: 'Galeri',
        to: '/warga/galeri',
        icon: 'i-lucide-camera',
        description: 'Kumpulan dokumentasi momen warga.'
      },
      {
        label: 'Pengumuman',
        to: '/warga/pengumuman',
        icon: 'i-lucide-bell-ring',
        description: 'Berita penting dan edaran resmi pengurus.'
      }
    ]
  }
]
</script>
