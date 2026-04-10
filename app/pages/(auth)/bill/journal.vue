<script setup lang="ts">
import { perPageLimit } from '~/const/utils'

definePageMeta({ middleware: ['auth'] })

// --- STATE ---
const dataJournal = ref([])
const summaryData = ref({
  in: '0.00',
  out: '0.00',
  balance: 0
})
const loading = ref(false)
const isOpenDetail = ref(false)
const selectedDetail = ref<any>(null)

// Filter States
const searchQuery = ref('')
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

// --- TABLE COLUMNS ---
const journalTable = [
  { accessorKey: 'date', header: 'Tanggal' },
  { accessorKey: 'coa', header: 'Akun / Tag' },
  { accessorKey: 'description', header: 'Keterangan' },
  { accessorKey: 'debit', header: 'Debit' },
  { accessorKey: 'credit', header: 'Kredit' },
  { accessorKey: 'action', header: 'Aksi' }
]

// --- ACTIONS ---

// Fetch Summary Stats (In, Out, Balance)
const getSummary = async () => {
  try {
    const res = await useApi<any>('/finance/journal/data')
    if (res.status === 1) {
      summaryData.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch summary:', err)
  }
}

// Fetch Journal List
const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/finance/journal/get', {
      params: {
        page: pagination.value.current_page,
        limit: pagination.value.per_page,
        search: searchQuery.value
      }
    })

    if (res.status === 1) {
      dataJournal.value = res.data
      pagination.value = { ...res.pagination }
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

// Fetch Detail Journal
const getDetail = async (id: string) => {
  try {
    const res = await useApi<any>(`/finance/journal/show/${id}`)
    if (res.status === 1) {
      selectedDetail.value = res.data
      isOpenDetail.value = true
    }
  } catch (err) {
    console.error('Detail fetch error:', err)
  }
}

// --- HELPERS ---
const getRefLabel = (type: string) => {
  if (type.includes('Bill')) return 'Tagihan Warga'
  if (type.includes('PettyCash')) return 'Kas Kecil (Petty Cash)'
  return 'Lainnya'
}

watch(
  () => pagination.value.per_page,
  () => {
    pagination.value.current_page = 1
    getData()
  }
)

onMounted(() => {
  getSummary()
  getData()
})
</script>

<template>
  <div class="space-y-6">
    <ConfirmDialog />

    <SharedHeaderBg>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary-50 rounded-lg">
          <UIcon
            name="i-lucide-book-open-check"
            class="w-5 h-5 text-primary-600"
          />
        </div>
        <h2 class="text-lg font-bold text-gray-900">Jurnal Keuangan</h2>
      </div>

      <div class="flex items-center gap-3">
        <div class="w-64">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari transaksi..."
            @keyup.enter="getData"
          />
        </div>
      </div>
    </SharedHeaderBg>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
      >
        <div class="p-3 bg-green-50 rounded-xl text-green-600">
          <UIcon name="i-lucide-trending-up" class="w-8 h-8" />
        </div>
        <div>
          <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Total Masuk (In)
          </p>
          <p class="text-xl font-black text-green-600">
            {{ formatCurrency(summaryData.in) }}
          </p>
        </div>
      </div>

      <div
        class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
      >
        <div class="p-3 bg-red-50 rounded-xl text-red-600">
          <UIcon name="i-lucide-trending-down" class="w-8 h-8" />
        </div>
        <div>
          <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Total Keluar (Out)
          </p>
          <p class="text-xl font-black text-red-600">
            {{ formatCurrency(summaryData.out) }}
          </p>
        </div>
      </div>

      <div
        class="bg-primary-600 p-6 rounded-2xl shadow-lg shadow-primary-100 flex items-center gap-4 text-white"
      >
        <div class="p-3 bg-white/20 rounded-xl">
          <UIcon name="i-lucide-wallet" class="w-8 h-8" />
        </div>
        <div>
          <p class="text-xs font-bold text-white/70 uppercase tracking-widest">
            Saldo Saat Ini
          </p>
          <p class="text-xl font-black">
            {{ formatCurrency(summaryData.balance) }}
          </p>
        </div>
      </div>
    </div>

    <div
      class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <UTable :data="dataJournal" :columns="journalTable" :loading="loading">
        <template #date-cell="{ row }">
          <div class="text-sm font-medium">
            {{ formatDate(row.original.date) }}
          </div>
        </template>

        <template #coa-cell="{ row }">
          <div class="font-bold text-primary-700">#{{ row.original.tag }}</div>
          <div class="text-xs text-gray-500">{{ row.original.coa?.name }}</div>
        </template>

        <template #description-cell="{ row }">
          <div class="max-w-xs">
            <p class="text-sm text-gray-700 line-clamp-1">
              {{ row.original.description }}
            </p>
            <div class="flex items-center gap-1 mt-1">
              <UBadge
                variant="soft"
                size="xs"
                color="neutral"
                class="text-[9px]"
              >
                {{ getRefLabel(row.original.ref_type) }}
              </UBadge>
            </div>
          </div>
        </template>

        <template #debit-cell="{ row }">
          <span
            :class="
              parseFloat(row.original.debit) > 0
                ? 'text-green-600 font-bold'
                : 'text-gray-300'
            "
          >
            {{
              parseFloat(row.original.debit) > 0
                ? formatCurrency(row.original.debit)
                : '-'
            }}
          </span>
        </template>

        <template #credit-cell="{ row }">
          <span
            :class="
              parseFloat(row.original.credit) > 0
                ? 'text-red-600 font-bold'
                : 'text-gray-300'
            "
          >
            {{
              parseFloat(row.original.credit) > 0
                ? formatCurrency(row.original.credit)
                : '-'
            }}
          </span>
        </template>

        <template #action-cell="{ row }">
          <UButton
            icon="i-heroicons-eye"
            variant="ghost"
            color="neutral"
            @click="getDetail(row.original.id)"
          />
        </template>
      </UTable>
    </div>

    <div class="flex justify-between items-center px-2">
      <div class="flex items-center gap-2 text-sm text-gray-500 font-medium">
        <span>Tampilkan</span>
        <USelect
          v-model.number="pagination.per_page"
          :items="perPageLimit"
          class="w-20"
        />
      </div>
      <UPagination
        v-model:page="pagination.current_page"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        @update:page="getData"
      />
    </div>

    <UModal v-model:open="isOpenDetail" :ui="{ content: 'sm:max-w-4xl' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div>
            <h3 class="text-lg font-black text-gray-900">
              Detail Jurnal Keuangan
            </h3>
            <p class="text-xs text-gray-400">ID: {{ selectedDetail?.id }}</p>
          </div>
          <UButton
            icon="i-heroicons-x-mark"
            variant="ghost"
            color="neutral"
            @click="isOpenDetail = false"
          />
        </div>
      </template>

      <template #body>
        <div v-if="selectedDetail" class="space-y-6">
          <div
            class="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner"
          >
            <div>
              <p
                class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1"
              >
                Tanggal
              </p>
              <p class="font-bold text-sm">
                {{ formatDate(selectedDetail.date) }}
              </p>
            </div>
            <div>
              <p
                class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1"
              >
                Akun (COA)
              </p>
              <p class="font-bold text-sm">
                #{{ selectedDetail.tag }} - {{ selectedDetail.coa.name }}
              </p>
            </div>
            <div>
              <p
                class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1"
              >
                Debit
              </p>
              <p class="font-black text-green-600">
                {{ formatCurrency(selectedDetail.debit) }}
              </p>
            </div>
            <div>
              <p
                class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1"
              >
                Kredit
              </p>
              <p class="font-black text-red-600">
                {{ formatCurrency(selectedDetail.credit) }}
              </p>
            </div>
          </div>

          <div class="p-4 bg-white border rounded-xl">
            <p class="text-xs font-bold text-gray-400 uppercase mb-2">
              Keterangan Jurnal
            </p>
            <p class="text-sm text-gray-700 leading-relaxed italic">
              "{{ selectedDetail.description }}"
            </p>
          </div>

          <div v-if="selectedDetail.ref" class="space-y-4">
            <div class="flex items-center gap-2">
              <div class="h-px flex-1 bg-gray-100"></div>
              <span
                class="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]"
                >Dokumen Referensi</span
              >
              <div class="h-px flex-1 bg-gray-100"></div>
            </div>

            <div
              class="bg-primary-50/50 p-6 rounded-2xl border border-primary-100 border-dashed"
            >
              <div class="flex justify-between items-start mb-4">
                <div>
                  <UBadge color="primary" variant="subtle" size="xs">{{
                    getRefLabel(selectedDetail.ref_type)
                  }}</UBadge>
                  <p class="mt-2 text-xs text-gray-500">
                    No. Ref: {{ selectedDetail.ref_id }}
                  </p>
                </div>
                <div v-if="selectedDetail.ref.status" class="text-right">
                  <p class="text-[10px] text-gray-400 font-bold uppercase mb-1">
                    Status Ref
                  </p>
                  <UBadge
                    :color="
                      selectedDetail.ref.status === 'paid' ||
                      selectedDetail.ref.status === 'approve'
                        ? 'success'
                        : 'warning'
                    "
                    variant="solid"
                  >
                    {{ selectedDetail.ref.status.toUpperCase() }}
                  </UBadge>
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-3 gap-y-4 text-sm">
                <div v-if="selectedDetail.ref.amount">
                  <p class="text-[10px] text-gray-400 font-bold uppercase">
                    Nilai Transaksi
                  </p>
                  <p class="font-bold">
                    {{ formatCurrency(selectedDetail.ref.amount) }}
                  </p>
                </div>
                <div v-if="selectedDetail.ref.category">
                  <p class="text-[10px] text-gray-400 font-bold uppercase">
                    Kategori
                  </p>
                  <p class="font-bold capitalize">
                    {{ selectedDetail.ref.category }}
                  </p>
                </div>
                <div
                  v-if="selectedDetail.ref.bill_date || selectedDetail.ref.date"
                >
                  <p class="text-[10px] text-gray-400 font-bold uppercase">
                    Tanggal Ref
                  </p>
                  <p class="font-bold">
                    {{
                      formatDate(
                        selectedDetail.ref.bill_date || selectedDetail.ref.date
                      )
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end w-full">
          <UButton
            label="Tutup"
            variant="ghost"
            color="neutral"
            @click="isOpenDetail = false"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
