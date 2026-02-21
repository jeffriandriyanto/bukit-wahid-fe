<template>
  <UContainer class="py-12 md:py-20 space-y-12">
    <header
      class="text-center text-white p-4 max-w-3xl mx-auto space-y-2 bg-linear-to-r from-primary-600 via-primary-400 to-primary-600 rounded-2xl"
    >
      <h1 class="text-xl md:text-3xl font-black tracking-tight">
        {{ pageData.title }}
      </h1>
      <p class="text-sm">{{ pageData.subtitle }}</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div
        v-for="post in announcements"
        :key="post.id"
        class="bg-white rounded-2xl border border-neutral-200 overflow-hidden h-full group hover:border-primary-500/50 cursor-pointer transition-all duration-300"
        @click="readMore(post)"
      >
        <div class="aspect-video overflow-hidden">
          <img
            :src="post.image"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            :alt="post.title"
          />
        </div>

        <div class="p-5 space-y-3">
          <div
            class="flex items-center gap-2 text-xs text-neutral-500 font-medium"
          >
            <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5" />
            {{ post.published_at ? formatDate(post.published_at) : 'Draft' }}
            <span class="text-neutral-700">|</span>
            <UIcon name="i-lucide-user" class="w-3.5 h-3.5" />
            {{ post.author.name }}
          </div>

          <h2
            class="text-xl font-bold group-hover:text-primary-400 transition-colors line-clamp-1"
          >
            {{ post.title }}
          </h2>

          <p class="text-neutral-400 text-sm line-clamp-3 leading-relaxed">
            {{ post.body }}
          </p>
        </div>

        <div
          class="flex items-center justify-between text-primary-500 font-bold text-sm p-5"
        >
          <span>Baca Selengkapnya</span>
          <UIcon
            name="i-lucide-arrow-right"
            class="group-hover:translate-x-1 transition-transform"
          />
        </div>
      </div>
    </div>

    <UModal
      v-model:open="isModalOpen"
      :title="selectedPost?.title"
      :description="`Diterbitkan oleh ${selectedPost?.author.name} pada ${
        selectedPost?.published_at ? formatDate(selectedPost.published_at) : '-'
      }`"
      :ui="{
        content: 'sm:max-w-2xl'
      }"
    >
      <template #body>
        <div class="space-y-6">
          <img
            :src="selectedPost?.image"
            class="w-full h-64 object-cover rounded-xl"
            :alt="selectedPost?.title"
          />
          <div class="prose prose-invert max-w-none">
            <p class="text-neutral-600 leading-relaxed whitespace-pre-wrap">
              {{ selectedPost?.body }}
            </p>
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'landingpage'
})

interface AnnouncementItem {
  id: string
  title: string
  slug: string
  image: string
  body: string
  published_at: string | null
  author: { name: string }
}

const isModalOpen = ref(false)
const selectedPost = ref<AnnouncementItem | null>(null)

const pageData = reactive({
  title: 'Pengumuman Warga',
  subtitle:
    'Pusat informasi, berita, dan pengumuman resmi RW.11 Bukit Wahid Regency.'
})

const announcements = ref<AnnouncementItem[]>([
  {
    id: '019c5e9e-09b5-722d-8889-e9816d9e10a1',
    title: 'Pemberitahuan Fogging Massal Lingkungan',
    slug: 'pemberitahuan-fogging-massal',
    image: 'https://picsum.photos/600/400?random=30',
    body: 'Sehubungan dengan meningkatnya kasus DBD di wilayah Manyaran, pengurus RW akan mengadakan fogging massal pada hari Minggu besok. Warga dimohon menutup makanan dan mengosongkan area teras.',
    published_at: '2026-02-15',
    author: { name: 'Ridwan Wibowo' }
  },
  {
    id: '019c5e9e-09b5-722d-8889-e9816d9e10a2',
    title: 'Perubahan Jadwal Pengambilan Sampah',
    slug: 'perubahan-jadwal-sampah',
    image: 'https://picsum.photos/600/400?random=31',
    body: 'Mulai pekan depan, pengambilan sampah yang biasanya dilakukan sore hari akan berpindah ke pagi hari mulai pukul 07:00 WIB. Mohon warga menyesuaikan jadwal pengeluaran bak sampah.',
    published_at: '2026-02-18',
    author: { name: 'Ridwan Wibowo' }
  },
  {
    id: '019c5e9e-09b5-722d-8889-e9816d9e10a3',
    title: 'Undangan Rapat Persiapan Ramadhan 2026',
    slug: 'rapat-persiapan-ramadhan',
    image: 'https://picsum.photos/600/400?random=32',
    body: 'Kami mengundang perwakilan RT 01-05 untuk hadir dalam rapat koordinasi persiapan kegiatan masjid dan keamanan lingkungan selama bulan suci Ramadhan 2026 di Balai Warga.',
    published_at: '2026-02-20',
    author: { name: 'Ridwan Wibowo' }
  },
  {
    id: '019c5e9e-09b5-722d-8889-e9816d9e10a4',
    title: 'Laporan Perbaikan Saluran Air Blok C',
    slug: 'laporan-perbaikan-saluran',
    image: 'https://picsum.photos/600/400?random=33',
    body: 'Pekerjaan perbaikan gorong-gorong di Blok C telah selesai 100%. Terima kasih atas kesabaran warga selama proses pengerjaan yang sempat mengganggu akses jalan utama.',
    published_at: '2026-02-21',
    author: { name: 'Ridwan Wibowo' }
  },
  {
    id: '019c5e9e-09b5-722d-8889-e9816d9e10a5',
    title: 'Pendaftaran Lomba Voli Antar RT',
    slug: 'lomba-voli-antar-rt',
    image: 'https://picsum.photos/600/400?random=34',
    body: 'Dalam rangka mempererat silaturahmi, pendaftaran lomba voli putra dan putri telah dibuka. Silakan hubungi seksi pemuda dan olahraga di masing-masing RT untuk pendaftaran tim.',
    published_at: '2026-02-21',
    author: { name: 'Ridwan Wibowo' }
  }
])

const readMore = (post: AnnouncementItem) => {
  selectedPost.value = post
  isModalOpen.value = true
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>
