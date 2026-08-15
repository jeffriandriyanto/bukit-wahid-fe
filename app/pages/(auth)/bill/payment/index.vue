<script setup lang="ts">
import { perPageLimit } from '~/const/utils'

definePageMeta({
  middleware: ['auth']
})

const {
  columnsPayment,
  dropdownPaymentAction,
  dataPayment,
  pagination,
  search,
  selectedStatus,
  loading,
  loadingDetail,
  submitting,
  isOpen,
  detail,
  reviewStatus,
  statusInfo,
  getData,
  openReview,
  submitReview
} = usePayment()

const statusFilterOptions = [
  { label: 'Belum Bayar', value: 'unpaid' },
  { label: 'Diterima', value: 'approve' },
  { label: 'Tidak Valid', value: 'unvalid' }
]
</script>

<template>
  <div class="space-y-4">
    <ConfirmDialog />

    <SharedHeaderBg>
      <div
        class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full py-2"
      >
        <div class="flex items-center gap-3 shrink-0">
          <div class="p-2 bg-primary-50 rounded-lg">
            <UIcon
              name="i-lucide-receipt-text"
              class="w-5 h-5 text-primary-600"
            />
          </div>
          <h2 class="text-lg font-bold text-gray-900 whitespace-nowrap">
            Review Pembayaran
          </h2>
        </div>

        <div class="flex flex-1 items-center gap-2 min-w-0 max-w-2xl">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Cari nama warga..."
            size="md"
            class="flex-1 max-w-sm"
            :ui="{ root: 'rounded-full' }"
          />

          <USelectMenu
            v-model="selectedStatus"
            :items="statusFilterOptions"
            value-key="value"
            label-key="label"
            placeholder="Filter Status"
            clear
            size="md"
            class="w-48"
            @change="
              () => {
                pagination.current_page = 1
                getData()
              }
            "
          />
        </div>
      </div>
    </SharedHeaderBg>

    <!-- Table -->
    <div
      class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <UTable
        :data="dataPayment"
        :columns="columnsPayment"
        :loading="loading"
        :ui="{
          thead: 'bg-gray-50/50',
          th: 'text-xs uppercase tracking-wider whitespace-nowrap',
          td: 'whitespace-nowrap'
        }"
      >
        <template #person-cell="{ row }">
          <div class="flex flex-col">
            <span class="font-bold text-gray-900 leading-tight">{{
              row.original.person?.name || '-'
            }}</span>
            <span class="text-xs text-gray-500">{{
              row.original.person?.username || '-'
            }}</span>
          </div>
        </template>

        <template #amount-cell="{ row }">
          <span class="font-semibold text-gray-900">{{
            formatCurrency(row.original.amount)
          }}</span>
        </template>

        <template #va-cell="{ row }">
          <span class="font-mono text-xs text-gray-600">{{
            row.original.va?.va_number || '-'
          }}</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="statusInfo(row.original.status).color"
            variant="soft"
            size="sm"
            class="font-bold uppercase"
          >
            {{ statusInfo(row.original.status).label }}
          </UBadge>
        </template>

        <template #created_at-cell="{ row }">
          <span class="text-gray-600">{{
            formatDate(row.original.created_at)
          }}</span>
        </template>

        <template #proof-cell="{ row }">
          <UIcon
            v-if="row.original.proof"
            name="i-lucide-check-circle"
            class="w-4 h-4 text-success-500"
          />
          <span v-else class="text-gray-300 italic">-</span>
        </template>

        <template #action-cell="{ row }">
          <UButton
            label="Review"
            color="primary"
            variant="soft"
            size="sm"
            icon="i-lucide-eye"
            @click="openReview(row.original)"
          />
        </template>
      </UTable>

      <div
        v-if="dataPayment.length === 0 && !loading"
        class="p-10 text-center"
      >
        <UIcon
          name="i-lucide-folder-open"
          class="w-10 h-10 text-gray-300 mx-auto mb-2"
        />
        <p class="text-gray-500 text-sm">Tidak ada data pembayaran.</p>
      </div>
    </div>

    <!-- Pagination -->
    <div class="flex justify-between">
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <span>Tampilkan</span>
        <USelect
          v-model.number="pagination.per_page"
          :items="perPageLimit"
          value-attribute="value"
          option-attribute="label"
          class="w-24"
        />
      </div>

      <UPagination
        v-model:page="pagination.current_page"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        @update:page="getData"
      />
    </div>

    <!-- Review Modal -->
    <UModal
      v-model:open="isOpen"
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #header>
        <div class="flex items-center gap-2 font-bold text-gray-900">
          <UIcon name="i-lucide-receipt-text" class="text-primary-600" />
          <span>Detail Pembayaran</span>
        </div>
      </template>

      <template #body>
        <div v-if="loadingDetail" class="py-10 text-center">
          <UIcon
            name="i-lucide-loader-circle"
            class="w-6 h-6 text-gray-300 animate-spin mx-auto"
          />
        </div>

        <div v-else-if="detail" class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-xs font-bold text-gray-400 uppercase"
                >Nama Warga</span
              >
              <p class="font-semibold text-gray-900">
                {{ detail.person?.name || '-' }}
              </p>
              <p class="text-xs text-gray-500">
                {{ detail.person?.username || '-' }}
              </p>
            </div>
            <div>
              <span class="text-xs font-bold text-gray-400 uppercase"
                >Nominal</span
              >
              <p class="font-bold text-gray-900">
                {{ formatCurrency(detail.amount) }}
              </p>
            </div>
            <div>
              <span class="text-xs font-bold text-gray-400 uppercase">VA</span>
              <p class="font-mono text-gray-700">
                {{ detail.va?.va_number || '-' }}
              </p>
            </div>
            <div>
              <span class="text-xs font-bold text-gray-400 uppercase"
                >Status</span
              >
              <UBadge
                :color="statusInfo(detail.status).color"
                variant="soft"
                size="sm"
                class="font-bold uppercase"
              >
                {{ statusInfo(detail.status).label }}
              </UBadge>
            </div>
          </div>

          <div v-if="detail.details?.length" class="space-y-2">
            <span class="text-xs font-bold text-gray-400 uppercase"
              >Rincian Tagihan</span
            >
            <div
              v-for="item in detail.details"
              :key="item.id"
              class="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
            >
              <span class="text-gray-600 capitalize">{{ item.category }}</span>
              <span class="font-semibold">{{
                formatCurrency(item.amount)
              }}</span>
            </div>
          </div>

          <div v-if="detail.proof" class="space-y-2">
            <span class="text-xs font-bold text-gray-400 uppercase"
              >Bukti Transfer</span
            >
            <img
              :src="detail.proof"
              alt="Bukti Transfer"
              class="w-full rounded-lg border border-gray-200 object-cover"
            >
          </div>

          <div class="border-t pt-4">
            <UFormField label="Aksi Review">
              <USelectMenu
                v-model="reviewStatus"
                :items="dropdownPaymentAction"
                value-key="key"
                label-key="label"
                placeholder="Pilih aksi..."
                size="lg"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-between w-full">
          <UButton
            label="Batal"
            color="neutral"
            variant="ghost"
            @click="isOpen = false"
          />
          <UButton
            label="Simpan Review"
            color="primary"
            :loading="submitting"
            :disabled="!reviewStatus"
            @click="submitReview"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
