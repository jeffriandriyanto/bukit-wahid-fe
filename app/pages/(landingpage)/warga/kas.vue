<template>
  <UContainer class="py-12 md:py-20 space-y-8">
    <header
      class="text-center text-white p-4 max-w-3xl mx-auto space-y-2 bg-linear-to-r from-primary-600 via-primary-400 to-primary-600 rounded-2xl"
    >
      <h1 class="text-xl md:text-3xl font-black tracking-tight">
        {{ pageData.title }}
      </h1>
      <p class="text-sm">{{ pageData.subtitle }}</p>
    </header>

    <div
      class="flex flex-col md:flex-row gap-4 justify-between items-center p-4"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-bold text-primary-500">{{
          filteredTransactions.length
        }}</span>
        <span class="text-neutral-400 font-medium">Transaksi</span>
      </div>

      <div class="flex gap-3 w-full md:w-auto">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Cari nama warga..."
          color="neutral"
          class="grow md:w-64"
        />
        <USelectMenu
          v-model="selectedCategory"
          :options="categories"
          placeholder="Filter Jenis"
          color="neutral"
          class="w-40"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="p-4 rounded-xl bg-success/10 border border-success/20">
        <p class="text-success text-xs font-bold uppercase">Total Kas Masuk</p>
        <p class="text-2xl font-black">Rp 4.250.000</p>
      </div>
      <div
        class="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20"
      >
        <p class="text-primary-500 text-xs font-bold uppercase">Belum Bayar</p>
        <p class="text-2xl font-black">12 Warga</p>
      </div>
    </div>

    <div
      v-if="filteredTransactions.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <UCard
        v-for="item in filteredTransactions"
        :key="item.id"
        :ui="{
          root: 'overflow-hidden group hover:ring-2 hover:ring-primary-500 transition-all duration-300'
        }"
      >
        <template #header>
          <div
            :class="item.status === 'Lunas' ? 'bg-success' : 'bg-warning'"
            class="px-4 py-2 flex justify-between items-center text-white"
          >
            <div
              class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              <UIcon
                :name="
                  item.status === 'Lunas'
                    ? 'i-lucide-check-circle'
                    : 'i-lucide-clock'
                "
              />
              {{ item.status }}
            </div>
            <div class="text-xs font-mono bg-black/20 px-2 py-1 rounded">
              {{ item.period }}
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex justify-between items-start">
            <div>
              <h3
                class="text-lg font-bold group-hover:text-primary-400 transition-colors"
              >
                {{ item.citizen_name }}
              </h3>
              <p class="text-primary-500 font-mono font-bold text-xl mt-1">
                {{ formatCurrency(item.amount) }}
              </p>
            </div>
          </div>

          <div class="space-y-2 border-t border-neutral-800 pt-4">
            <div class="flex items-center gap-2 text-sm text-neutral-600">
              <UIcon name="i-lucide-tag" class="shrink-0 text-neutral-600" />
              <span>{{ item.type }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-neutral-800">
              <UIcon name="i-lucide-info" class="shrink-0 text-neutral-600" />
              <span class="italic text-xs">{{ item.note }}</span>
            </div>
          </div>
        </div>

        <template #footer>
          <div
            class="flex justify-between items-center text-[10px] uppercase tracking-widest text-neutral-500 font-bold"
          >
            <span>Tgl Bayar:</span>
            <span>{{
              item.payment_date ? formatDate(item.payment_date) : '-'
            }}</span>
          </div>
        </template>
      </UCard>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-neutral-800 rounded-3xl"
    >
      <UIcon name="i-lucide-search-x" class="w-12 h-12 text-neutral-700 mb-4" />
      <p class="text-neutral-500 font-medium">Data iuran tidak ditemukan.</p>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'landingpage'
})

interface TransactionItem {
  id: string
  citizen_name: string
  amount: number
  type: string
  status: 'Lunas' | 'Pending'
  payment_date: string | null
  period: string
  note: string
}

const searchQuery = ref('')
const selectedCategory = ref('Semua')
const categories = [
  'Semua',
  'Iuran Bulanan',
  'Keamanan',
  'Kebersihan',
  'Lain-lain'
]

const pageData = reactive({
  title: 'Laporan Keuangan',
  subtitle:
    'Jungle Toon Bukit Wahid Regency Manyaran Semarang Barat, Kota Semarang.'
})

const transactions = ref<TransactionItem[]>([
  {
    id: '1',
    citizen_name: 'Budi Santoso',
    amount: 150000,
    type: 'Iuran Bulanan',
    status: 'Lunas',
    payment_date: '2026-02-01',
    period: 'Februari 2026',
    note: 'Transfer BCA'
  },
  {
    id: '2',
    citizen_name: 'Siti Aminah',
    amount: 50000,
    type: 'Kebersihan',
    status: 'Pending',
    payment_date: null,
    period: 'Februari 2026',
    note: 'Menunggu konfirmasi'
  },
  {
    id: '3',
    citizen_name: 'Agus Prayogo',
    amount: 200000,
    type: 'Iuran Bulanan',
    status: 'Lunas',
    payment_date: '2026-02-05',
    period: 'Februari 2026',
    note: 'Tunai via RT'
  },
  {
    id: '4',
    citizen_name: 'Hendra Wijaya',
    amount: 150000,
    type: 'Iuran Bulanan',
    status: 'Lunas',
    payment_date: '2026-02-10',
    period: 'Februari 2026',
    note: 'Transfer Mandiri'
  },
  {
    id: '5',
    citizen_name: 'Rina Permata',
    amount: 100000,
    type: 'Keamanan',
    status: 'Pending',
    payment_date: null,
    period: 'Februari 2026',
    note: 'Konfirmasi via WhatsApp'
  }
])

const filteredTransactions = computed(() => {
  return transactions.value.filter((item) => {
    const sQuery = searchQuery.value.toLowerCase().trim()
    const matchSearch = item.citizen_name.toLowerCase().includes(sQuery)
    const matchCategory =
      selectedCategory.value === 'Semua' || item.type === selectedCategory.value
    return matchSearch && matchCategory
  })
})
</script>
