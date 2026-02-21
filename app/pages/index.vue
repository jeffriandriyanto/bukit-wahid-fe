<script setup lang="ts">
/**
 * Interface sesuai mapping API Backend
 */
interface AgendaItem {
  id: string
  title: string
  location: string
  description: string
  start_date: string
  start_time: string
  fors: { id: string; name: string }[]
}

interface AnnouncementItem {
  id: string
  title: string
  slug: string
  image: string
  body: string
  published_at: string | null
  author: { name: string }
}

definePageMeta({
  layout: 'landingpage'
})

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
  },
  welcome: {
    title: 'Kata Sambutan',
    image: '/images/landingpage.png', // Ganti dengan foto Ketua RW
    paragraphs: [
      'Assalamu’alaikum Wr. Wb. Salam sejahtera untuk semua. Dalam Era Teknologi Digitalisasi saat ini, kami pengurus RW 11 Ingin memulai dengan menerapkan Pelayanan dan Informasi dengan berbasis Teknologi Informasi.',
      'Untuk keberhasilannya maka dibutuhkan dukungan dan peran serta semua warga RW 11. Kita berharap program ini terus berkelanjutan dan bisa bermanfaat dalam meningkatkan Pelayanan dan Informasi.',
      'Sehingga keterbukaan Informasi dan kepercayan dari Warga semakin meningkat karena saat ini tuntutan Transparansi sudah menjadi keniscayaan.'
    ]
  },
  // Data dummy mengikuti struktur API yang kamu berikan
  announcements: [
    {
      id: '019c5e9e-09b5-722d-8889-e9816d9e10a2',
      title: 'Judul Pengumuman 1',
      slug: 'judul-pengumuman-1',
      image: 'https://picsum.photos/400/300?random=2',
      published_at: '2026-02-15',
      author: { name: 'Ridwan Wibowo' }
    },
    {
      id: '019c5e9e-09b5-722d-8889-e9816d9e10a2',
      title: 'Judul Pengumuman 2',
      slug: 'judul-pengumuman-2',
      image: 'https://picsum.photos/400/300?random=2',
      published_at: '2026-02-15',
      author: { name: 'Ridwan Wibowo' }
    },
    {
      id: '019c5e9e-09b5-722d-8889-e9816d9e10a2',
      title: 'Judul Pengumuman 3',
      slug: 'judul-pengumuman-3',
      image: 'https://picsum.photos/400/300?random=2',
      published_at: '2026-02-15',
      author: { name: 'Ridwan Wibowo' }
    }
  ] as AnnouncementItem[],

  events: [
    {
      id: '019bf2d4-fbea-7220-ab04-d436e93ac999',
      title: 'Agenda Pertama',
      location: 'https://link.zoom.misal.com/123456789',
      description: 'Pertemuan pertama untuk diskusi proyek baru',
      start_date: '2026-01-25',
      start_time: '19:00',
      fors: [{ id: '1', name: 'RT 04' }]
    }
  ] as AgendaItem[],

  gallery: [
    'https://picsum.photos/600/600?random=10',
    'https://picsum.photos/600/600?random=11',
    'https://picsum.photos/600/600?random=12',
    'https://picsum.photos/600/600?random=13'
  ]
})

const carouselUi = {
  item: 'basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 px-2'
}

// Helper untuk deteksi link (Zoom/Meet vs Alamat Fisik)
const isUrl = (str: string) => str.startsWith('http')
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <section
      class="relative h-[calc(100vh-40px)] w-full overflow-hidden flex items-center"
    >
      <div class="absolute inset-0 z-0">
        <img
          :src="pageData.hero.bgImage"
          :alt="pageData.hero.title"
          class="w-full h-full object-cover"
        />
        <div
          class="absolute inset-0 bg-linear-to-r from-neutral-950 via-neutral-950/60 to-transparent"
        />
      </div>

      <UContainer class="relative z-10 w-full">
        <div class="max-w-2xl space-y-6 flex flex-col items-start">
          <div class="space-y-2">
            <h1
              class="text-4xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight text-balance"
            >
              RW 11 Bukit <br />
              <span class="text-primary-600">
                {{ pageData.hero.highlight }}
              </span>
              Regency
            </h1>
          </div>

          <div class="space-y-3 text-neutral-300 max-w-lg">
            <div class="flex gap-3 items-start">
              <UIcon name="i-lucide-map-pin" class="w-6 h-6 shrink-0" />
              <p class="text-sm md:text-base leading-relaxed">
                {{ pageData.hero.location }}
              </p>
            </div>
            <div class="flex gap-3 items-start">
              <UIcon name="i-lucide-home" class="w-5 h-5 shrink-0" />
              <p class="text-xs md:text-sm">
                {{ pageData.hero.secretariat }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-4 pt-4">
            <UButton
              :to="pageData.hero.whatsapp"
              color="primary"
              variant="solid"
              icon="i-simple-icons-whatsapp"
              class="rounded-full px-8 hover:scale-105 transition-transform"
            >
              Hubungi Kami
            </UButton>
            <UButton
              :to="`mailto:${pageData.hero.email}`"
              icon="i-lucide-mail"
              class="bg-white text-black hover:bg-white/80 hover:scale-105 transition-transform rounded-full px-8 border-none"
            >
              Email
            </UButton>
          </div>
        </div>
      </UContainer>

      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <UIcon name="i-lucide-chevron-down" class="w-6 h-6 text-white/50" />
      </div>
    </section>

    <section class="py-24 bg-white">
      <UContainer>
        <div class="grid md:grid-cols-2 gap-16 items-center">
          <div class="relative">
            <img
              :src="pageData.welcome.image"
              class="rounded-3xl shadow-2xl transition-all duration-700"
            />
          </div>
          <div class="space-y-6">
            <h2 class="text-4xl font-black tracking-tight">
              {{ pageData.welcome.title }}
            </h2>
            <div
              class="space-y-4 text-neutral-600 italic leading-relaxed text-lg"
            >
              <p v-for="(p, i) in pageData.welcome.paragraphs" :key="i">
                {{ p }}
              </p>
            </div>
            <div class="pt-6 border-t border-neutral-100">
              <p class="font-bold text-xl text-neutral-900">Pengurus RW 11</p>
              <p class="text-primary-600 font-medium">Bukit Wahid Regency</p>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <section class="bg-neutral-50 py-24">
      <UContainer>
        <div class="flex justify-between items-center mb-10">
          <h2 class="text-3xl font-black tracking-tight">Pengumuman</h2>
          <UButton
            to="/warga/pengumuman"
            variant="link"
            color="primary"
            trailing-icon="i-lucide-arrow-right"
            >Lihat Semua</UButton
          >
        </div>
        <UCarousel
          v-slot="{ item }"
          :items="pageData.announcements"
          :ui="carouselUi"
        >
          <div
            class="bg-white rounded-2xl border border-neutral-200 overflow-hidden group h-full"
          >
            <div class="overflow-hidden aspect-video">
              <img
                :src="item.image"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div class="p-6">
              <p class="text-xs font-bold text-primary-600 uppercase mb-2">
                {{ item.published_at || 'Baru' }}
              </p>
              <h3
                class="font-bold text-lg leading-tight mb-4 group-hover:text-primary-600 transition-colors"
              >
                {{ item.title }}
              </h3>
              <div class="flex items-center gap-2 text-neutral-500 text-sm">
                <UIcon name="i-lucide-user" class="w-4 h-4" />
                {{ item.author.name }}
              </div>
            </div>
          </div>
        </UCarousel>
      </UContainer>
    </section>

    <section class="py-24 bg-white">
      <UContainer>
        <div class="flex justify-between items-center mb-10">
          <h2 class="text-3xl font-black tracking-tight text-neutral-900">
            Agenda Kegiatan
          </h2>
          <UButton
            to="/warga/agenda"
            variant="link"
            color="primary"
            trailing-icon="i-lucide-arrow-right"
            >Lihat Semua</UButton
          >
        </div>
        <UCarousel v-slot="{ item }" :items="pageData.events" :ui="carouselUi">
          <div
            class="bg-white border-2 border-neutral-100 rounded-2xl p-6 flex flex-col justify-between h-full hover:border-primary-500 transition-colors shadow-sm"
          >
            <div class="space-y-4">
              <div class="flex justify-between items-start">
                <div
                  class="bg-primary-50 text-primary-700 px-3 py-1 rounded-lg text-xs font-bold font-mono"
                >
                  {{ item.start_time }} WIB
                </div>
                <div class="flex gap-1">
                  <span
                    v-for="f in item.fors"
                    :key="f.id"
                    class="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded text-[10px] font-bold"
                  >
                    {{ f.name }}
                  </span>
                </div>
              </div>
              <h3 class="font-black text-xl text-neutral-900 leading-tight">
                {{ item.title }}
              </h3>
              <p class="text-neutral-500 text-sm line-clamp-2">
                {{ item.description }}
              </p>
            </div>
            <div
              class="mt-6 pt-4 border-t border-neutral-50 flex items-center gap-2 overflow-hidden"
            >
              <UIcon
                :name="
                  isUrl(item.location) ? 'i-lucide-video' : 'i-lucide-map-pin'
                "
                class="shrink-0 text-primary-500"
              />
              <a
                v-if="isUrl(item.location)"
                :href="item.location"
                target="_blank"
                class="text-xs text-blue-600 truncate hover:underline font-medium"
                >Link Meeting</a
              >
              <span v-else class="text-xs text-neutral-600 truncate">{{
                item.location
              }}</span>
            </div>
          </div>
        </UCarousel>
      </UContainer>
    </section>

    <section class="py-24 bg-neutral-900 text-white">
      <UContainer>
        <div class="text-center mb-12">
          <h2 class="text-3xl font-black">Galeri Warga</h2>
          <p class="text-neutral-400 mt-2 italic text-sm">
            Dokumentasi kegiatan di lingkungan Bukit Wahid
          </p>
        </div>


        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="(img, idx) in pageData.gallery"
            :key="idx"
            class="aspect-square rounded-xl overflow-hidden"
          >
            <img
              :src="img"
              class="w-full h-full object-cover hover:scale-110 transition-transform duration-700 cursor-pointer"
            />
          </div>
        </div>

        <div class="flex justify-end mt-4">
        <UButton
          to="/warga/galeri"
          variant="link"
          color="primary"
          trailing-icon="i-lucide-arrow-right"
          >Lihat Semua</UButton
        >
        </div>
      </UContainer>
    </section>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
