<script setup lang="ts">
const { dropdownRT, getDropdownRT } = useApiDropdown()
const config = useRuntimeConfig()

interface AgendaItem {
  id: string
  title: string
  location: string
  description: string
  start_date: string
  start_time: string
  fors: { id: string; name: string }[]
}

definePageMeta({
  layout: 'landingpage'
})

// --- State ---
const currentPage = ref(1)
const perPage = 6
const allAgendas = ref<AgendaItem[]>([])
const searchQuery = ref('')
const selectedRT = ref('Semua')

// --- SEO ---
useSeoMeta({
  title: 'Agenda & Kegiatan - RW 11 Bukit Wahid Regency',
  description:
    'Jadwal rangkaian kegiatan, rapat warga, dan acara sosial di lingkungan Bukit Wahid Regency.',
  ogImage: '/images/landingpage.png'
})

// --- Data Fetching ---
const { data: agendaResponse, status } = await useFetch<any>('/agenda', {
  baseURL: config.public.baseUrl,
  query: {
    page: currentPage,
    limit: perPage,
    search: searchQuery,
    rt: computed(() => (selectedRT.value === 'Semua' ? '' : selectedRT.value))
  },
  key: 'agenda-list',
  watch: [currentPage, searchQuery, selectedRT] // Watch otomatis untuk trigger fetch
})

// Update List Agenda (Incremental Load)
watch(
  agendaResponse,
  (newData) => {
    if (newData?.data) {
      if (currentPage.value === 1) {
        allAgendas.value = newData.data
      } else {
        const newItems = newData.data.filter(
          (newItem: AgendaItem) =>
            !allAgendas.value.some((oldItem) => oldItem.id === newItem.id)
        )
        allAgendas.value.push(...newItems)
      }
    }
  },
  { immediate: true }
)

const onFilterChange = () => {
  currentPage.value = 1
}

const hasMore = computed(() => {
  if (!agendaResponse.value) return false
  return (agendaResponse.value?.data?.length || 0) >= perPage
})

const loadMore = () => {
  currentPage.value++
}

// --- Helpers ---
const isLink = (str: string) => str.startsWith('http')

// Helper untuk memecah tanggal agar UI lebih "mahal"
const parseDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return {
    day: d.getDate(),
    month: d.toLocaleString('id-ID', { month: 'short' }).toUpperCase(),
    full: d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }
}

onMounted(() => getDropdownRT())
</script>

<template>
  <div class="bg-neutral-50/50 min-h-screen pb-24 overflow-hidden">
    <SharedLandingHeader
      badge="Kalender Lingkungan"
      title="Agenda &"
      highlight="Kegiatan"
      subtitle="Tetap terhubung dengan setiap rangkaian acara dan pertemuan penting di lingkungan Bukit Wahid Regency."
    />

    <UContainer class="py-4">
      <div
        class="bg-white p-6 rounded-[2rem] shadow-premium mb-12 flex flex-col md:flex-row gap-6 items-center border border-neutral-100 intersect-once intersect:animate-fade-in-up"
      >
        <div class="flex items-center gap-4 grow">
          <div class="p-3 bg-primary-50 rounded-2xl text-primary-600">
            <UIcon name="i-lucide-calendar-range" class="w-6 h-6" />
          </div>
          <div>
            <span
              class="block text-2xl font-black text-neutral-900 leading-none"
              >{{ allAgendas.length }}</span
            >
            <span
              class="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400"
              >Total Agenda</span
            >
          </div>
        </div>

        <div class="flex flex-wrap gap-3 w-full md:w-auto">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Cari kegiatan..."
            color="neutral"
            variant="subtle"
            class="grow md:w-64"
            size="lg"
            :ui="{ base: 'rounded-full' }"
            @update:model-value="onFilterChange"
          />
          <USelectMenu
            v-model="selectedRT"
            :options="['Semua', ...dropdownRT.map((rt) => rt.label)]"
            placeholder="Filter RT"
            color="neutral"
            variant="subtle"
            class="w-full md:w-48"
            size="lg"
            :ui="{ base: 'rounded-full' }"
            @update:model-value="onFilterChange"
          />
        </div>
      </div>

      <div
        v-if="allAgendas.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <div
          v-for="(item, idx) in allAgendas"
          :key="item.id"
          class="group relative bg-white rounded-[2.5rem] border border-neutral-100 shadow-premium hover:shadow-premium-hover transition-all duration-500 flex flex-col intersect-once intersect:animate-fade-in-up"
          :style="{ 'animation-delay': idx * 0.1 + 's' }"
        >
          <div class="absolute top-6 right-6 z-10">
            <div
              class="bg-neutral-900/5 backdrop-blur-md px-3 py-1 rounded-full border border-black/5 flex items-center gap-1.5"
            >
              <UIcon
                name="i-lucide-clock"
                class="w-3.5 h-3.5 text-primary-600"
              />
              <span class="text-[10px] font-black text-neutral-900"
                >{{ item.start_time }} WIB</span
              >
            </div>
          </div>

          <div class="p-8 pb-4 flex items-start gap-6">
            <div
              class="flex flex-col items-center bg-primary-600 text-white rounded-2xl px-4 py-3 shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform duration-500"
            >
              <span class="text-2xl font-black leading-none">{{
                parseDate(item.start_date).day
              }}</span>
              <span
                class="text-[10px] font-black uppercase tracking-widest mt-1"
                >{{ parseDate(item.start_date).month }}</span
              >
            </div>
            <div class="flex-1 pt-1">
              <span
                class="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] mb-1 block"
              >
                {{ parseDate(item.start_date).full }}
              </span>
              <h3
                class="text-xl font-black text-neutral-900 leading-tight group-hover:text-primary-600 transition-colors"
              >
                {{ item.title }}
              </h3>
            </div>
          </div>

          <div class="px-8 py-4 space-y-6 flex-1 flex flex-col">
            <p class="text-neutral-500 text-sm leading-relaxed line-clamp-3">
              {{ item.description }}
            </p>

            <div class="mt-auto space-y-4">
              <div
                class="flex items-center gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-100 group-hover:border-primary-200 transition-colors"
              >
                <div class="p-2 bg-white rounded-lg shadow-sm">
                  <UIcon
                    :name="
                      isLink(item.location)
                        ? 'i-lucide-video'
                        : 'i-lucide-map-pin'
                    "
                    class="w-4 h-4 text-primary-500"
                  />
                </div>
                <div class="min-w-0">
                  <p
                    class="text-[9px] text-neutral-400 font-black uppercase tracking-widest leading-none mb-1"
                  >
                    Lokasi
                  </p>
                  <NuxtLink
                    v-if="isLink(item.location)"
                    :to="item.location"
                    target="_blank"
                    class="text-xs font-bold text-blue-600 truncate block hover:underline"
                  >
                    Klik Tautan Meeting
                  </NuxtLink>
                  <p
                    v-else
                    class="text-xs font-bold text-neutral-700 truncate block"
                  >
                    {{ item.location }}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap gap-1.5 pt-2">
                <UBadge
                  v-for="target in item.fors"
                  :key="target.id"
                  variant="subtle"
                  color="neutral"
                  class="rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-500"
                >
                  {{ target.name }}
                </UBadge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="status !== 'pending'"
        class="py-32 flex flex-col items-center justify-center animate-fade-in-up"
      >
        <div
          class="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6"
        >
          <UIcon
            name="i-lucide-calendar-x"
            class="w-12 h-12 text-neutral-300"
          />
        </div>
        <h4 class="text-xl font-bold text-neutral-900">Belum Ada Agenda</h4>
        <p class="text-neutral-500 mt-2">
          Tidak ada jadwal kegiatan untuk kriteria pencarian ini.
        </p>
        <UButton
          color="neutral"
          variant="link"
          class="mt-4"
          @click="
            searchQuery = '',
            selectedRT = 'Semua'
          "
          >Reset Filter</UButton
        >
      </div>

      <div v-if="hasMore" class="flex justify-center pt-16">
        <UButton
          :loading="status === 'pending'"
          variant="solid"
          color="neutral"
          size="xl"
          class="rounded-full px-12 font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
          @click="loadMore"
        >
          Muat Agenda Lainnya
        </UButton>
      </div>
    </UContainer>
  </div>
</template>
