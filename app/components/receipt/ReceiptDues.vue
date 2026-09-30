<script setup lang="ts">
import { formatDate, formatYearMonth } from '~/utils/date'
import { terbilang } from '~/utils/terbilang'

interface Props {
  bill: any
  residentName?: string
  residentAddress?: string
}

const props = defineProps<Props>()

const billCategory = computed(() => (props.bill?.category || '').toLowerCase())

const isDues = computed(() => billCategory.value === 'dues')

const displayPurpose = computed(() => {
  if (isDues.value) {
    const period = props.bill?.bill_date ? formatYearMonth(props.bill.bill_date) : ''
    return period ? `Iuran RW bulan ${period}` : 'Iuran RW bulanan'
  }
  return props.bill?.description || 'Tagihan Lainnya'
})

const displayAddress = computed(() => {
  const type = props.bill?.residence_type || props.bill?.residence?.type || ''
  const kavling = props.bill?.residence_kavling || props.bill?.residence?.kavling || ''

  if (type && kavling) {
    return `${type} / ${kavling}`
  }
  if (props.residentAddress && props.residentAddress.includes('/')) {
    return props.residentAddress
  }
  if (type) return type
  if (kavling) return kavling
  if (props.residentAddress) return props.residentAddress
  return '-'
})

const displayName = computed(() => {
  return props.residentName || props.bill?.person?.name || '-'
})

const formatNumber = (num: number | string) => {
  const val = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(val)) return '0'
  return new Intl.NumberFormat('id-ID').format(val)
}
</script>

<template>
  <div
    class="receipt-container bg-white text-neutral-900 border-2 border-neutral-800 p-6 rounded-lg relative overflow-hidden font-serif select-none"
    style="width: 780px; min-height: 330px; box-sizing: border-box;"
  >
    <!-- Double border inner line -->
    <div class="border border-neutral-700 p-4 h-full flex flex-col justify-between relative">
      
      <!-- Top Section -->
      <div class="flex items-start justify-between border-b pb-3 border-neutral-300">
        <!-- Kop Samping / Kiri -->
        <div class="w-1/3 flex flex-col border-r border-neutral-300 pr-4">
          <div class="flex items-baseline gap-1">
            <span class="text-xl font-bold font-serif text-red-700 tracking-wide">BUKIT WAHID</span>
            <span class="text-xs text-neutral-600 font-sans tracking-tight">regency</span>
          </div>
          <div class="h-[2px] bg-red-700 w-full my-1"></div>
          <div class="text-[13px] font-bold text-neutral-800 tracking-wider">
            KELURAHAN MANYARAN
          </div>
          <div class="text-lg font-black text-red-800 tracking-widest mt-0.5">
            RW. XI
          </div>
        </div>

        <!-- Judul Tengah & Nomor Kanan -->
        <div class="w-2/3 pl-6 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-black text-red-800 tracking-widest font-serif pl-8">
              KWITANSI
            </h2>
            <div class="text-sm font-mono font-bold text-neutral-800">
              No : <span class="text-base tracking-wider text-neutral-950 font-black">{{ bill?.no_kwitansi || '...................' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Rows -->
      <div class="my-3 space-y-2 text-sm">
        <!-- Telah Terima Dari -->
        <div class="flex items-baseline">
          <span class="w-36 text-neutral-700 italic font-medium shrink-0">Telah terima dari</span>
          <span class="mr-2 font-bold">:</span>
          <div class="flex-1 border-b border-dotted border-neutral-500 pb-0.5 font-bold text-neutral-900 capitalize font-sans tracking-wide">
            {{ displayName }}
          </div>
        </div>

        <!-- Alamat -->
        <div class="flex items-baseline">
          <span class="w-36 text-neutral-700 italic font-medium shrink-0">Alamat</span>
          <span class="mr-2 font-bold">:</span>
          <div class="flex-1 border-b border-dotted border-neutral-500 pb-0.5 font-medium text-neutral-800 font-sans">
            {{ displayAddress }}
          </div>
        </div>

        <!-- Uang Sebanyak -->
        <div class="flex items-baseline">
          <span class="w-36 text-neutral-700 italic font-medium shrink-0">Uang sebanyak</span>
          <span class="mr-2 font-bold">:</span>
          <div class="flex-1 border-b border-dotted border-neutral-500 pb-0.5 font-bold text-neutral-900 italic font-serif">
            {{ terbilang(bill?.amount || 0) }}
          </div>
        </div>

        <!-- Guna Membayar -->
        <div class="flex items-baseline">
          <span class="w-36 text-neutral-700 italic font-medium shrink-0">Guna membayar</span>
          <span class="mr-2 font-bold">:</span>
          <div class="flex-1 border-b border-dotted border-neutral-500 pb-0.5 font-semibold text-red-700 italic">
            {{ displayPurpose }}
          </div>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="flex items-end justify-between pt-2">
        <!-- Nominal Box -->
        <div class="flex items-center gap-2">
          <span class="text-base font-serif italic font-bold">Rp.</span>
          <div class="bg-rose-100/80 border border-rose-300 px-4 py-1.5 rounded text-2xl font-black italic tracking-wider text-neutral-900 font-mono shadow-inner">
            {{ formatNumber(bill?.amount || 0) }}
          </div>
        </div>

        <!-- Tanggal & Stempel -->
        <div class="flex items-center gap-6 relative pr-4">
          <div class="text-right">
            <p class="text-sm font-serif italic text-neutral-800">
              Semarang, <span class="font-sans font-medium text-neutral-900">{{ formatDate(bill?.payment_date || bill?.bill_date || new Date()) }}</span>
            </p>
          </div>

          <!-- Stempel Lunas RW XI -->
          <div class="stamp-badge pointer-events-none">
            <div class="w-20 h-20 rounded-full border-2 border-dashed border-red-600 flex flex-col items-center justify-center text-red-600 p-1 transform -rotate-12 select-none shadow-sm">
              <div class="w-full h-full rounded-full border border-red-600 flex flex-col items-center justify-center text-center">
                <span class="text-[11px] font-black tracking-widest leading-none text-red-700">LUNAS</span>
                <div class="h-[1px] w-10 bg-red-600 my-0.5"></div>
                <span class="text-[10px] font-extrabold tracking-wider leading-none text-red-700">RW XI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.receipt-container {
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
}

.stamp-badge {
  filter: drop-shadow(0 0 1px rgba(220, 38, 38, 0.3));
}
</style>
