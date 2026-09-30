<script setup lang="ts">
import { formatDate, formatYearMonth } from '~/utils/date'
import { terbilang } from '~/utils/terbilang'

interface Props {
  bill: any
  residentName?: string
  residentKavling?: string
}

const props = defineProps<Props>()

const billCategory = computed(() => (props.bill?.category || '').toLowerCase())

const isIpl = computed(() => billCategory.value === 'ipl')
const isPam = computed(() => billCategory.value === 'pam')

const displayName = computed(() => {
  return props.residentName || props.bill?.person?.name || '-'
})

const displayKavling = computed(() => {
  const type = props.bill?.residence_type || props.bill?.residence?.type || ''
  const kavling = props.bill?.residence_kavling || props.bill?.residence?.kavling || ''

  if (type && kavling) {
    return `${type} / ${kavling}`
  }
  if (props.residentKavling && props.residentKavling.includes('/')) {
    return props.residentKavling
  }
  if (type) return type
  if (kavling) return kavling
  if (props.residentKavling) return props.residentKavling
  return '-'
})

const formatNumber = (num: number | string) => {
  const val = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(val) || val === null || val === undefined) return '0'
  return new Intl.NumberFormat('id-ID').format(val)
}

const iplValue = computed(() => {
  if (isIpl.value) {
    const raw = Number(props.bill?.price || 0) * Number(props.bill?.qty || 1)
    return raw > 0 ? raw : Number(props.bill?.amount || 0)
  }
  return 0
})

const pamQty = computed(() => {
  if (isPam.value) {
    if (props.bill?.qty !== null && props.bill?.qty !== undefined) return Number(props.bill.qty)
    if (props.bill?.pam_after && props.bill?.pam_before) {
      return Math.max(0, Number(props.bill.pam_after) - Number(props.bill.pam_before))
    }
  }
  return 0
})

const pamPrice = computed(() => {
  if (isPam.value) {
    return Number(props.bill?.price) || 3000
  }
  return 3000
})

const pamValue = computed(() => {
  if (isPam.value) {
    const calc = pamQty.value * pamPrice.value
    return calc > 0 ? calc : Number(props.bill?.amount || 0)
  }
  return 0
})

const penaltyValue = computed(() => Number(props.bill?.penalty || 0))
const discountValue = computed(() => Number(props.bill?.discount || 0))

const otherValue = computed(() => {
  if (penaltyValue.value > 0 || discountValue.value > 0) {
    return penaltyValue.value - discountValue.value
  }
  if (!isIpl.value && !isPam.value) {
    return Number(props.bill?.amount || 0)
  }
  return 0
})

const otherLabel = computed(() => {
  const parts: string[] = []
  if (penaltyValue.value > 0) parts.push(`Denda: Rp ${formatNumber(penaltyValue.value)}`)
  if (discountValue.value > 0) parts.push(`Diskon: -Rp ${formatNumber(discountValue.value)}`)
  if (!isIpl.value && !isPam.value && props.bill?.description) {
    parts.push(props.bill.description)
  }
  return parts.length > 0 ? parts.join(', ') : '..................................................'
})

const totalValue = computed(() => {
  return Number(props.bill?.amount || 0)
})
</script>

<template>
  <div
    class="receipt-estate bg-white text-neutral-900 border-2 border-neutral-800 p-6 rounded-lg relative overflow-hidden font-serif select-none"
    style="width: 780px; min-height: 440px; box-sizing: border-box;"
  >
    <!-- Kop & Nomor Header -->
    <div class="flex items-start justify-between border-b pb-2 border-neutral-300">
      <!-- Kop Kiri -->
      <div class="flex flex-col">
        <div class="flex items-baseline gap-1.5">
          <span class="text-2xl font-black font-serif text-red-700 tracking-wide">BUKIT WAHID</span>
          <span class="text-xs text-neutral-600 font-sans tracking-tight">regency</span>
        </div>
        <div class="h-[2px] bg-red-700 w-full my-0.5"></div>
        <div class="text-[13px] font-bold text-neutral-900 font-sans tracking-wider">
          ESTATE MANAGEMENT
        </div>
      </div>

      <!-- Header Kanan: Nomor & Type/Kav -->
      <div class="space-y-1 text-sm font-sans">
        <div class="flex items-center gap-2">
          <span class="w-20 font-serif italic text-neutral-700">Nomor</span>
          <span class="font-bold">:</span>
          <span class="text-red-700 font-black font-mono tracking-widest text-base">
            {{ bill?.no_kwitansi || '...................' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-20 font-serif italic text-neutral-700">Type/Kav</span>
          <span class="font-bold">:</span>
          <span class="font-bold text-neutral-900 border-b border-dotted border-neutral-400 min-w-[140px] pb-0.5">
            {{ displayKavling }}
          </span>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="mt-3 space-y-2 text-sm font-serif">
      <!-- Nama -->
      <div class="flex items-baseline">
        <span class="w-20 italic font-medium text-neutral-700 shrink-0">Nama</span>
        <span class="mr-2 font-bold">:</span>
        <div class="flex-1 border-b border-dotted border-neutral-500 pb-0.5 font-sans font-bold text-neutral-900 capitalize">
          {{ displayName }}
        </div>
      </div>

      <!-- Guna Pembayaran Header -->
      <div class="italic font-medium text-neutral-800 pt-0.5">
        Guna Pembayaran :
      </div>

      <!-- Rincian IPL -->
      <div v-if="isIpl" class="flex items-baseline pl-2 text-xs font-serif">
        <span  class="italic font-medium text-neutral-800">
          - Iuran Pemeliharaan Lingkungan bulan : 
          <span class="font-sans font-semibold text-neutral-900 underline mx-1">
            {{ isIpl ? formatYearMonth(bill?.bill_date) : '' }}
          </span>
          <span v-if="isIpl && bill?.qty && bill?.price" class="text-neutral-600 not-italic text-[11px] ml-1 font-sans">
            ({{ bill.qty }} {{ bill.unit || 'm2' }} x Rp {{ formatNumber(bill.price) }})
          </span>
        </span>
        <div class="flex-1 border-neutral-400 mx-2"></div>
        <div class="flex items-center gap-1 shrink-0 font-sans font-medium text-neutral-900">
          <span>= Rp.</span>
          <span class="min-w-[90px] text-right font-bold">{{ isIpl ? formatNumber(iplValue) : '-' }}</span>
        </div>
      </div>

      <!-- Rincian Air Artetis -->
      <div v-if="isPam" class="pl-2 space-y-1 text-xs font-serif">
        <div class="flex items-baseline">
          <span class="italic font-medium text-neutral-800">
            - Air Artetis Bulan :
            <span class="font-sans font-semibold text-neutral-900 underline mx-1">
              {{ isPam ? formatYearMonth(bill?.bill_date) : '............................................................' }}
            </span>
          </span>
        </div>

        <!-- Stan Awal, Stan Akhir & Pemakaian -->
        <div class="pl-3 space-y-1">
          <!-- Stan Awal & Akhir Boxes -->
          <div class="flex items-center gap-6 text-[11px] font-sans">
            <div class="flex items-center gap-2">
              <span class="font-serif italic text-neutral-700 w-16">Stan Awal :</span>
              <div class="border border-neutral-600 px-3 py-0.5 w-24 text-center font-mono font-bold bg-neutral-50/50">
                {{ isPam && bill?.pam_before !== null && bill?.pam_before !== undefined ? bill.pam_before : '-' }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-serif italic text-neutral-700 w-16">Stan Akhir :</span>
              <div class="border border-neutral-600 px-3 py-0.5 w-24 text-center font-mono font-bold bg-neutral-50/50">
                {{ isPam && bill?.pam_after !== null && bill?.pam_after !== undefined ? bill.pam_after : '-' }}
              </div>
            </div>
          </div>

          <!-- Pemakaian Formula -->
          <div class="flex items-baseline justify-between text-xs pt-0.5">
            <div class="flex items-center gap-1 font-serif italic text-neutral-800">
              <span>Pemakaian :</span>
              <span class="font-sans font-medium text-neutral-900 not-italic border-b border-dotted border-neutral-400 px-2">
                {{ isPam ? pamQty : '..........' }}
              </span>
              <span>{{ bill?.unit || 'm3' }} x Rp. {{ formatNumber(pamPrice) }},-</span>
            </div>
            <div class="flex items-center gap-1 font-sans font-medium text-neutral-900">
              <span>= Rp.</span>
              <span class="min-w-[90px] text-right font-bold">{{ isPam ? formatNumber(pamValue) : '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!--- Diskon -->
      <div class="flex items-baseline pl-2 text-xs font-serif">
        <span class="italic font-medium text-neutral-800">
          - Diskon (-)
        </span>
        <div class="flex-1 border-neutral-400 mx-2"></div>
        <div class="flex items-center gap-1 shrink-0 font-sans font-medium text-neutral-900">
          <span>= Rp.</span>
          <span class="min-w-[90px] text-right font-bold">{{ formatNumber(discountValue) }}</span>
        </div>
      </div>

      <!-- Denda -->
      <div class="flex items-baseline pl-2 text-xs font-serif">
        <span class="italic font-medium text-neutral-800">
          - Denda (+)
        </span>
        <div class="flex-1 border-neutral-400 mx-2"></div>
        <div class="flex items-center gap-1 shrink-0 font-sans font-medium text-neutral-900">
          <span>= Rp.</span>
          <span class="min-w-[90px] text-right font-bold">{{ formatNumber(penaltyValue) }}</span>
        </div>
      </div>

      

      <!-- Total Amount Box -->
      <div class="flex justify-end pt-1">
        <div class="flex items-center gap-2">
          <span class="font-serif italic font-bold text-sm">Rp.</span>
          <div class="bg-neutral-200/80 border border-neutral-300 px-4 py-1 rounded min-w-[140px] text-right font-mono font-black text-lg text-neutral-900 shadow-inner">
            {{ formatNumber(totalValue) }}
          </div>
        </div>
      </div>

      <!-- Terbilang Box -->
      <div class="flex items-baseline gap-2 pt-1">
        <span class="italic font-bold text-sm text-neutral-800 shrink-0">Terbilang :</span>
        <div class="flex-1 bg-neutral-200/80 border border-neutral-300 px-3 py-1.5 rounded text-xs font-bold italic font-serif text-neutral-900 shadow-inner">
          {{ terbilang(totalValue) }}
        </div>
      </div>
    </div>

    <!-- Footer: Tanggal & Stempel -->
    <div class="flex items-end justify-end mt-4 pt-1 pr-2 relative">
      <div class="flex items-center gap-6">
        <div class="text-right">
          <p class="text-sm font-serif italic text-neutral-800">
            Semarang, <span class="font-sans font-medium text-neutral-900">{{ formatDate(bill?.payment_date || bill?.bill_date || new Date()) }}</span>
          </p>
        </div>

        <!-- Stempel Lunas EM BWR -->
        <div class="stamp-badge pointer-events-none">
          <div class="w-20 h-20 rounded-full border-2 border-dashed border-red-600 flex flex-col items-center justify-center text-red-600 p-1 transform -rotate-12 select-none shadow-sm">
            <div class="w-full h-full rounded-full border border-red-600 flex flex-col items-center justify-center text-center">
              <span class="text-[11px] font-black tracking-widest leading-none text-red-700">LUNAS</span>
              <div class="h-[1px] w-12 bg-red-600 my-0.5"></div>
              <span class="text-[9px] font-extrabold tracking-wider leading-none text-red-700">EM BWR</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.receipt-estate {
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
}

.stamp-badge {
  filter: drop-shadow(0 0 1px rgba(220, 38, 38, 0.3));
}
</style>
