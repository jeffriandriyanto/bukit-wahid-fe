<script setup lang="ts">
import { useRwStructure } from '~/composables/structure/useRwOrg'
const { rwDataList, fetchRwList } = useRwStructure()
const configRuntime = useRuntimeConfig()
const store = useConfigStore()

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

interface GalleryItem {
  id: string
  name: string
  description: string
  galeries_count: number
  date: string
  files?: string[]
}

const pageData = reactive({
  hero: {
    title: 'RW 11 Bukit Wahid Regency',
    location:
      'Kelurahan Manyaran, Kecamatan Semarang Barat, Kota Semarang, Jawa Tengah.',
    secretariat: store.values.address,
    bgImage: store.values.hero_banner || '/images/landingpage.png',
    whatsapp: `https://wa.me/${store.values.whatsapp}`,
    email: store.values.email
  },
  welcome: {
    title: 'Kata Sambutan',
    image: '/images/landingpage.png', // Ganti dengan foto Ketua RW
    paragraphs:
      'Assalamu’alaikum Wr. Wb. Salam sejahtera untuk semua. Dalam Era Teknologi Digitalisasi saat ini, kami pengurus RW 11 Ingin memulai dengan menerapkan Pelayanan dan Informasi dengan berbasis Teknologi Informasi. Untuk keberhasilannya maka dibutuhkan dukungan dan peran serta semua warga RW 11. Kita berharap program ini terus berkelanjutan dan bisa bermanfaat dalam meningkatkan Pelayanan dan Informasi. Sehingga keterbukaan Informasi dan kepercayan dari Warga semakin meningkat karena saat ini tuntutan Transparansi sudah menjadi keniscayaan.'
  }
})

const carouselUi = {
  item: 'basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 px-3 py-4'
}

const isUrl = (str: string) => str.startsWith('http')

const { data: newsResponse } = await useFetch<any>('/news', {
  baseURL: configRuntime.public.baseUrl,
  query: { page: 1, limit: 8 },
  key: 'home-news'
})

const { data: agendaResponse } = await useFetch<any>('/agenda', {
  baseURL: configRuntime.public.baseUrl,
  query: { page: 1, limit: 8 },
  key: 'home-agenda'
})

const { data: galleryResponse } = await useFetch<any>('/galery', {
  baseURL: configRuntime.public.baseUrl,
  query: { page: 1, limit: 5 },
  key: 'home-gallery'
})

const galleryItems = computed<GalleryItem[]>(
  () => galleryResponse.value?.data || []
)

const announcements = computed<AnnouncementItem[]>(
  () => newsResponse.value?.data || []
)
const events = computed<AgendaItem[]>(() => agendaResponse.value?.data || [])
onMounted(fetchRwList)

definePageMeta({
  layout: 'landingpage'
})
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-neutral-50/50 text-neutral-900 antialiased overflow-x-hidden"
  >
    <section
      class="relative h-screen w-full overflow-hidden flex items-center border-b border-neutral-100"
    >
      <div class="absolute inset-0 z-0">
        <NuxtImg
          :src="pageData.hero.bgImage"
          :alt="pageData.hero.title"
          fetchpriority="high"
          loading="eager"
          format="avif,webp"
          class="w-full h-full object-cover scale-105 animate-[ken-burns_20s_ease_infinite]"
        />
        <div
          class="absolute inset-0 bg-linear-to-r from-neutral-950/90 via-neutral-950/70 to-transparent"
        />
      </div>

      <div class="absolute inset-0 z-1 opacity-10">
        <svg width="100%" h="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                stroke-width="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <UContainer class="relative z-10 w-full py-20">
        <div
          class="max-w-3xl space-y-8 flex flex-col items-start animate-fade-in-up"
        >
          <div class="space-y-3">
            <h1
              class="text-5xl md:text-6xl font-extrabold text-white leading-[1.05] tracking-tighter text-balance"
            >
              RW 11 BUKIT<br />
              <span class="text-primary-500">WAHID</span>
              Regency
            </h1>
            <p class="text-neutral-300 max-w-2xl font-medium tracking-wide">
              Mewujudkan hunian yang harmonis, aman, dan berteknologi untuk
              seluruh warga.
            </p>
          </div>

          <div class="space-y-4 text-neutral-300 max-w-lg backdrop-blur-sm">
            <div class="flex gap-3.5 items-start">
              <UIcon
                name="i-lucide-map-pin"
                class="w-6 h-6 shrink-0 text-primary-400 mt-0.5"
              />
              <p class="text-sm md:text-base leading-relaxed">
                {{ pageData.hero.location }}
              </p>
            </div>
            <div class="flex gap-3.5 items-start border-t border-white/10 pt-4">
              <UIcon
                name="i-lucide-home"
                class="w-5 h-5 shrink-0 text-primary-400"
              />
              <p class="text-xs md:text-sm font-medium">
                {{ pageData.hero.secretariat || '' }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-5 pt-6">
            <UButton
              :to="pageData.hero.whatsapp"
              target="_blank"
              color="primary"
              variant="solid"
              size="xl"
              icon="i-simple-icons-whatsapp"
              class="rounded-full px-10 transform hover:scale-105 hover:shadow-[0_10px_30px_-10px_rgba(var(--color-primary-500),0.5)] transition-all duration-300"
            >
              Hubungi Warga
            </UButton>
            <UButton
              :to="`mailto:${pageData.hero.email}`"
              icon="i-lucide-mail"
              size="xl"
              class="bg-white text-neutral-950 hover:bg-neutral-100 hover:scale-105 transition-all duration-300 rounded-full px-10 border-none shadow-lg"
            >
              Email Admin
            </UButton>
          </div>
        </div>
      </UContainer>

      <div
        class="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-[100px] opacity-60"
      />

      <div
        class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
      >
        <span class="text-xs text-white uppercase tracking-widest font-bold"
          >Scroll</span
        >
        <div
          class="w-6 h-10 border-2 border-white rounded-full flex justify-center p-1"
        >
          <div class="w-1 h-2 bg-white rounded-full animate-bounce" />
        </div>
      </div>
    </section>

    <section
      class="py-32 bg-white relative intersect-once intersect:animate-fade-in-up opacity-0"
    >
      <UContainer>
        <div class="grid md:grid-cols-12 gap-16 items-center">
          <div class="md:col-span-5 relative group">
            <div
              class="absolute -bottom-8 -left-8 w-40 h-40 border-l-8 border-b-8 border-primary-100 rounded-bl-3xl z-0"
            />
            <div
              class="absolute -top-8 -right-8 w-40 h-40 bg-neutral-100 rounded-tr-[5rem] z-0"
            />

            <div
              class="absolute top-6 left-6 w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center shadow-2xl z-20 scale-100 group-hover:scale-110 transition-transform duration-300"
            >
              <UIcon name="i-lucide-quote" class="text-white w-7 h-7" />
            </div>

            <NuxtImg
              :src="pageData.welcome.image"
              alt="Ketua RW 11 Bukit Wahid Regency"
              sizes="sm:100vw md:50vw lg:400px"
              format="avif,webp"
              class="relative z-10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] object-cover aspect-4/5 bg-neutral-100"
            />
          </div>

          <div class="md:col-span-7 space-y-8">
            <div class="space-y-2">
              <UBadge
                variant="subtle"
                color="primary"
                size="lg"
                class="rounded-full px-4 uppercase tracking-widest font-bold text-xs"
                >Sambutan</UBadge
              >
              <h2
                class="text-4xl font-extrabold tracking-tighter text-neutral-950 leading-tight text-balance"
              >
                {{ pageData.welcome.title }}
              </h2>
            </div>

            <div
              class="space-y-5 text-neutral-700 leading-relaxed text-lg font-medium"
            >
              <p class="relative pl-6">
                <span
                  class="absolute left-0 top-0 text-primary-300 font-serif text-3xl"
                  >“</span
                >
                {{ store.values.greeting }}
              </p>
            </div>

            <div
              class="pt-8 border-t border-neutral-100 flex items-center gap-4 bg-neutral-50 p-6 rounded-2xl"
            >
              <div>
                <p
                  class="font-extrabold text-2xl text-neutral-950 tracking-tight"
                >
                  {{ rwDataList[0]?.incumbent?.name || '-' }}
                </p>
                <p class="text-primary-700 font-semibold tracking-wide">
                  Ketua Pengurus RW 11 • Bukit Wahid Regency
                </p>
              </div>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <section
      class="bg-neutral-50 py-32 relative overflow-hidden intersect-once intersect:animate-fade-in-up opacity-0"
    >
      <div class="absolute inset-0 opacity-[0.02] z-0">
        <svg width="100%" height="100%">
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <UContainer class="relative z-10">
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-neutral-200/60 pb-8"
        >
          <div class="space-y-1">
            <h2
              class="text-3xl font-extrabold tracking-tighter text-neutral-950"
            >
              Warta Warga
            </h2>
            <p class="text-neutral-600 text-lg">
              Informasi terbaru dan pengumuman resmi di lingkungan RW 11.
            </p>
          </div>
          <UButton
            to="/warga/pengumuman"
            variant="solid"
            color="neutral"
            class="rounded-full px-6 shadow-sm hover:shadow-lg transition-all"
            trailing-icon="i-lucide-arrow-right"
            >Lihat Semua</UButton
          >
        </div>

        <UCarousel
          v-slot="{ item }"
          :items="announcements"
          :ui="carouselUi"
          arrows
        >
          <div
            class="bg-white cursor-pointer rounded-3xl border border-neutral-100 overflow-hidden group h-full flex flex-col shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)] transition-all duration-500"
            @click="navigateTo(`/warga/pengumuman/${item.slug}`)"
          >
            <div class="overflow-hidden aspect-16/10">
              <NuxtImg
                :src="item.image"
                sizes="sm:100vw md:50vw lg:350px"
                format="avif,webp"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
            </div>
            <div class="p-7 flex flex-col flex-1 justify-between">
              <div>
                <div class="flex items-center gap-2 mb-3">
                  <UIcon
                    name="i-lucide-calendar-days"
                    class="w-4 h-4 text-primary-500"
                  />
                  <p
                    class="text-sm font-semibold text-primary-700 uppercase tracking-wider"
                  >
                    {{ item.published_at || 'Baru Saja' }}
                  </p>
                </div>
                <h3
                  class="font-bold text-xl text-neutral-950 leading-tight mb-5 group-hover:text-primary-600 transition-colors line-clamp-2"
                >
                  {{ item.title }}
                </h3>
              </div>
              <div
                class="flex items-center gap-3 text-neutral-600 text-sm pt-5 border-t border-neutral-100"
              >
                <UAvatar
                  :alt="item.author.name"
                  size="xs"
                  class="ring-1 ring-neutral-200"
                />
                <span class="font-medium">{{ item.author.name }}</span>
              </div>
            </div>
          </div>
        </UCarousel>
      </UContainer>
    </section>

    <section
      class="py-32 bg-white relative intersect-once intersect:animate-fade-in-up opacity-0"
    >
      <div
        class="absolute bottom-0 right-0 w-96 h-96 bg-primary-50 rounded-full blur-[120px] opacity-70 translate-x-1/3 translate-y-1/3"
      />

      <UContainer>
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-neutral-100 pb-8"
        >
          <div class="space-y-1">
            <h2
              class="text-3xl font-extrabold tracking-tighter text-neutral-950"
            >
              Agenda & Kegiatan
            </h2>
            <p class="text-neutral-600 text-lg">
              Jangan lewatkan momen kebersamaan dan rapat penting warga.
            </p>
          </div>
          <UButton
            to="/warga/agenda"
            variant="solid"
            color="neutral"
            class="rounded-full px-6 shadow-sm"
            trailing-icon="i-lucide-arrow-right"
            >Kalender Kegiatan</UButton
          >
        </div>

        <UCarousel v-slot="{ item }" :items="events" :ui="carouselUi" arrows>
          <div
            class="bg-white border border-neutral-100 rounded-3xl p-8 flex flex-col justify-between h-full hover:border-primary-200 hover:shadow-[0_15px_40px_-10px_rgba(var(--color-primary-500),0.08)] transition-all duration-500 shadow-sm relative overflow-hidden group"
          >
            <div
              class="absolute -top-10 -right-10 w-24 h-24 bg-primary-50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500"
            />

            <div class="space-y-5 relative z-10">
              <div class="flex justify-between items-center gap-2">
                <div
                  class="bg-primary-50 text-primary-700 px-4 py-1.5 rounded-full text-xs font-bold font-mono tracking-tight ring-1 ring-primary-100 flex items-center gap-1.5"
                >
                  <UIcon name="i-lucide-clock" class="w-3.5 h-3.5" />
                  {{ item.start_time }} WIB
                </div>
                <div class="flex gap-1.5 wrap justify-end">
                  <span
                    v-for="f in item.fors.slice(0, 2)"
                    :key="f.id"
                    class="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  >
                    {{ f.name }}
                  </span>
                </div>
              </div>

              <h3
                class="font-extrabold text-2xl text-neutral-950 leading-snug tracking-tight max-h-16 line-clamp-2"
              >
                {{ item.title }}
              </h3>

              <p
                class="text-neutral-600 text-base line-clamp-3 leading-relaxed"
              >
                {{ item.description }}
              </p>
            </div>

            <div
              class="mt-8 pt-5 border-t border-neutral-100 flex items-center gap-3 overflow-hidden relative z-10"
            >
              <div
                class="p-2.5 bg-neutral-100 rounded-xl flex items-center justify-center shrink-0"
              >
                <UIcon
                  :name="
                    isUrl(item.location) ? 'i-lucide-video' : 'i-lucide-map-pin'
                  "
                  class="w-5 h-5 text-primary-600"
                />
              </div>

              <div class="flex-1 overflow-hidden">
                <p
                  class="text-xs text-neutral-400 font-medium uppercase tracking-widest mb-0.5"
                >
                  Lokasi
                </p>
                <a
                  v-if="isUrl(item.location)"
                  :href="item.location"
                  target="_blank"
                  class="text-sm text-blue-600 truncate hover:underline font-semibold block"
                  >Klik Link Meeting</a
                >
                <span
                  v-else
                  class="text-sm text-neutral-800 truncate font-semibold block"
                  >{{ item.location }}</span
                >
              </div>
            </div>
          </div>
        </UCarousel>
      </UContainer>
    </section>

    <section class="py-24 relative overflow-hidden">
      <div class="absolute inset-0 bg-primary-600 z-0">
        <div
          class="absolute inset-0 opacity-10"
          style="
            background-image: radial-gradient(#fff 1px, transparent 1px);
            background-size: 30px 30px;
          "
        ></div>
      </div>

      <UContainer class="relative z-10">
        <div
          class="bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/20 p-8 md:p-16 overflow-hidden shadow-2xl"
        >
          <div class="grid md:grid-cols-12 gap-12 items-center">
            <div class="md:col-span-7 space-y-8 animate-fade-in-up">
              <div class="space-y-4">
                <UBadge
                  variant="subtle"
                  class="bg-white/20 text-white border-none rounded-full px-4 font-bold uppercase tracking-widest text-[10px]"
                >
                  Mobile Experience
                </UBadge>
                <h2
                  class="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight"
                >
                  Layanan Warga dalam <br />
                  <span class="text-primary-200">Satu Genggaman</span>
                </h2>
                <p class="text-primary-50 text-lg leading-relaxed max-w-xl">
                  Pantau <b>iuran lingkungan, tagihan air</b>, info kegiatan,
                  hingga lapor keluhan kini lebih mudah. Download aplikasi resmi
                  <b>Bukit Wahid Digital</b> untuk kemudahan akses informasi
                  kapanpun dan dimanapun.
                </p>
              </div>

              <div class="flex flex-wrap gap-4 pt-4">
                <UButton
                  :to="store.values.link_googleplay"
                  target="_blank"
                  class="bg-neutral-950 hover:bg-black text-white px-8 py-4 rounded-2xl flex items-center gap-3 transition-all hover:scale-105 border-none shadow-xl"
                >
                  <UIcon name="i-simple-icons-googleplay" class="w-8 h-8" />
                  <div class="text-left leading-none">
                    <p class="text-[10px] uppercase font-bold opacity-60">
                      Get it on
                    </p>
                    <p class="text-xl font-black tracking-tight">Google Play</p>
                  </div>
                </UButton>
              </div>
            </div>

            <div class="md:col-span-5 relative hidden md:block">
              <div
                class="flex gap-1 relative z-10 transform rotate-2 hover:rotate-0 transition-transform duration-700"
              >
                <NuxtImg
                  src="/images/app-2.png"
                  alt="App Mockup"
                  class="w-full max-w-30 max-h-max mx-auto drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)]"
                />
                <NuxtImg
                  src="/images/app-1.png"
                  alt="App Mockup"
                  class="w-full max-w-30 max-h-max mx-auto drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)]"
                />
                <NuxtImg
                  src="/images/app-3.png"
                  alt="App Mockup"
                  class="w-full max-w-30 max-h-max mx-auto drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)]"
                />
              </div>
              <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-400 rounded-full blur-[100px] opacity-40 z-0"
              ></div>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <section
      class="py-32 bg-neutral-950 text-white relative overflow-hidden intersect-once intersect:animate-fade-in-up opacity-0"
    >
      <UContainer class="relative z-10">
        <div
          class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 border-b border-white/10 pb-10"
        >
          <div class="space-y-3">
            <UBadge
              variant="subtle"
              color="primary"
              size="lg"
              class="rounded-full px-4 uppercase tracking-widest font-bold text-xs bg-primary-950 text-primary-300 ring-primary-900 ring-1"
              >Lensa Warga</UBadge
            >
            <h2
              class="text-5xl font-extrabold tracking-tighter leading-tight text-balance"
            >
              Momen Kebersamaan
            </h2>
            <p
              class="text-neutral-400 max-w-xl text-lg leading-relaxed font-medium"
            >
              Dokumentasi otentik setiap jejak langkah gotong royong dan
              kehangatan warga Bukit Wahid Regency.
            </p>
          </div>
          <UButton
            to="/warga/galeri"
            variant="ghost"
            color="primary"
            size="xl"
            trailing-icon="i-lucide-arrow-right"
            class="hover:bg-primary-600/10 rounded-full px-8 shrink-0"
          >
            Jelajahi Galeri
          </UButton>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            v-for="(item, idx) in galleryItems"
            :key="item.id"
            class="group relative cursor-pointer overflow-hidden rounded-4xl border border-white/5 shadow-2xl transition-all duration-500 ease-in-out hover:-translate-y-2 hover:border-primary-500/30"
            :class="[idx === 1 || idx === 3 ? 'lg:translate-y-10' : '']"
            @click="navigateTo(`/warga/galeri/${item.id}`)"
          >
            <div
              class="absolute inset-0 z-20 bg-linear-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500"
            />

            <div
              class="absolute bottom-0 left-0 z-30 p-8 w-full transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500"
            >
              <h3
                class="text-2xl font-extrabold leading-snug mb-3 tracking-tight text-balance"
              >
                {{ item.name }}
              </h3>
              <div
                class="flex items-center justify-between text-neutral-300 text-sm pt-4 border-t border-white/10"
              >
                <span class="font-medium">{{ formatDate(item.date) }}</span>
                <span
                  class="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm"
                >
                  <UIcon name="i-lucide-image" class="w-3.5 h-3.5" />
                  {{ item.galeries_count }} Foto
                </span>
              </div>
            </div>

            <div class="aspect-3/4 overflow-hidden bg-neutral-900">
              <NuxtImg
                :src="item.files?.[0] || '/images/placeholder-gallery.jpg'"
                :alt="item.name"
                sizes="sm:100vw md:50vw lg:300px"
                format="avif,webp"
                class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000 ease-out"
              />
            </div>

            <div
              class="absolute top-6 right-6 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-full ring-1 ring-white/20"
            >
              <UIcon name="i-lucide-expand" class="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </UContainer>
    </section>
  </div>
</template>

<style scoped>
@keyframes ken-burns {
  0% {
    transform: scale(1.05) translate(0, 0);
  }
  50% {
    transform: scale(1.15) translate(-1%, -1%);
  }
  100% {
    transform: scale(1.05) translate(0, 0);
  }
}

.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-3 {
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
