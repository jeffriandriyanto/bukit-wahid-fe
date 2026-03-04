<template>
  <UContainer class="py-12 space-y-2">
    <header
      class="w-full text-white mx-auto p-4 rounded-2xl bg-primary-600 border border-neutral-200/60 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
    >
      <div class="flex flex-col items-center gap-2">
        <h1 class="text-xl md:text-2xl font-bold uppercase tracking-wide">
          {{ pageData.title }}
        </h1>
        <p class="text-sm text-center leading-snug italic">
          "{{ pageData.subtitle }}"
        </p>
      </div>
    </header>

    <div
      class="flex flex-col md:flex-row gap-4 justify-between items-center p-4"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-bold text-primary-500">{{
          allAgendas.length
        }}</span>
        <span class="text-neutral-400 font-medium">Agenda Terkumpul</span>
      </div>

      <div class="flex gap-3 w-full md:w-auto">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Cari agenda..."
          color="neutral"
          class="grow md:w-64"
          @update:model-value="onFilterChange"
        />
        <USelectMenu
          v-model="selectedRT"
          placeholder="Filter RT"
          :items="dropdownRT"
          value-key="key"
          label-key="label"
          class="w-48"
          @update:model-value="onFilterChange"
        />
      </div>
    </div>

    <div
      v-if="allAgendas.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <UCard
        v-for="item in allAgendas"
        :key="item.id"
        :ui="{
          root: 'overflow-hidden group hover:ring-2 hover:ring-primary-500 transition-all duration-300',
          body: 'bg-neutral-100'
        }"
      >
        <template #header>
          <div
            class="bg-primary-600 px-4 py-2 flex justify-between items-center text-white"
          >
            <div
              class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              <UIcon name="i-lucide-calendar" />
              {{ formatDate(item.start_date) }}
            </div>
            <div
              class="flex items-center gap-1 text-xs font-mono bg-black/20 px-2 py-1 rounded"
            >
              <UIcon name="i-lucide-clock" />
              {{ item.start_time }}
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <h3 class="text-xl font-bold transition-colors">
              {{ item.title }}
            </h3>
            <p class="text-neutral-400 text-sm mt-2 line-clamp-2">
              {{ item.description }}
            </p>
          </div>

          <div class="flex items-start gap-2 text-sm">
            <UIcon
              name="i-lucide-map-pin"
              class="mt-1 text-primary-500 shrink-0"
            />
            <div class="grow">
              <span
                v-if="!isLink(item.location)"
                class="text-neutral-600 italic"
              >
                {{ item.location }}
              </span>
              <NuxtLink
                v-else
                :to="item.location"
                target="_blank"
                class="text-primary-600 italic font-bold hover:underline"
              >
                Klik Link Lokasi / Meeting
              </NuxtLink>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="target in item.fors"
              :key="target.id"
              variant="subtle"
              color="neutral"
              size="xs"
              class="rounded-full"
            >
              {{ target.name }}
            </UBadge>
          </div>
        </template>
      </UCard>
    </div>

    <div
      v-else-if="status !== 'pending'"
      class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-neutral-200 rounded-3xl"
    >
      <UIcon
        name="i-lucide-calendar-x"
        class="w-12 h-12 text-neutral-300 mb-4"
      />
      <p class="text-neutral-500 font-medium">
        Tidak ada agenda yang ditemukan.
      </p>
    </div>

    <div v-if="hasMore" class="flex justify-center pt-8">
      <UButton
        :loading="status === 'pending'"
        variant="ghost"
        color="primary"
        class="px-10 py-3 rounded-full border-2 border-primary-500 font-bold hover:bg-primary-50 transition-all"
        @click="loadMore"
      >
        Tampilkan Lebih Banyak
      </UButton>
    </div>
  </UContainer>
</template>

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

const pageData = reactive({
  title: 'Agenda dan Kegiatan',
  subtitle:
    'Jungle Toon Bukit Wahid Regency Manyaran Semarang Barat, Kota Semarang.'
})

// --- SEO ---
useSeoMeta({
  title: `${pageData.title} - RW 11 Bukit Wahid Regency`,
  ogTitle: pageData.title,
  description: pageData.subtitle,
  ogDescription: pageData.subtitle,
  twitterCard: 'summary_large_image'
})

// --- Data Fetching ---

const { data: agendaResponse, status } = await useFetch<any>('/agenda', {
  baseURL: config.public.baseUrl,
  query: {
    page: currentPage,
    limit: perPage,
    search: searchQuery,
    rt: computed(() =>
      selectedRT.value === 'Semua' ? '' : selectedRT.value
    )
  },
  key: 'agenda-list'
})

// Update List Agenda
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
const isLink = (str: string) =>
  str.startsWith('http') || str.startsWith('https')

onMounted(() => getDropdownRT())
</script>
