<script setup lang="ts">
import { toJpeg } from 'html-to-image'
import { formatDateTime, formatDate, formatYearMonth } from '~/utils/date'
import { terbilang } from '~/utils/terbilang'

interface Props {
  modelValue: boolean
  payment: any
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])

const toast = useToast()
const config = useRuntimeConfig()
const receiptWrapperRef = ref<HTMLElement | null>(null)
const isDownloadingImage = ref(false)

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const formatNumber = (num: number | string | undefined | null) => {
  const val = typeof num === 'string' ? parseFloat(num) : num
  if (val === null || val === undefined || isNaN(val)) return '0'
  return new Intl.NumberFormat('id-ID').format(val)
}

const formatCurrency = (num: number | string | undefined | null) => {
  return `Rp ${formatNumber(num)}`
}

// Kavling / Unit resolution
const displayKavling = computed(() => {
  if (!props.payment) return '-'
  
  // Check from details' bill residence
  if (Array.isArray(props.payment.details)) {
    for (const d of props.payment.details) {
      const res = d.bill?.residence
      if (res) {
        const parts = [res.type, res.kavling].filter(Boolean)
        if (parts.length > 0) return parts.join(' / ')
      }
    }
  }

  // Fallback to person's address
  const addr = props.payment.person?.address
  if (addr) {
    const parts = [addr.type, addr.kavling].filter(Boolean)
    if (parts.length > 0) return parts.join(' / ')
  }

  return '-'
})

const paymentDateFormatted = computed(() => {
  const date = props.payment?.payment_date || props.payment?.created_at
  return date ? formatDateTime(date) : '-'
})

const paymentDateOnly = computed(() => {
  const date = props.payment?.payment_date || props.payment?.created_at
  return date ? formatDate(date) : '-'
})

const terbilangFormatted = computed(() => {
  return terbilang(props.payment?.amount || 0)
})

const totalPenalty = computed(() => {
  if (!Array.isArray(props.payment?.details)) return 0
  return props.payment.details.reduce((sum: number, d: any) => {
    return sum + Number(d.bill?.penalty || 0)
  }, 0)
})

const totalDiscount = computed(() => {
  if (!Array.isArray(props.payment?.details)) return 0
  return props.payment.details.reduce((sum: number, d: any) => {
    return sum + Number(d.bill?.discount || 0)
  }, 0)
})

const totalPokok = computed(() => {
  const total = Number(props.payment?.amount || 0)
  return total - totalPenalty.value + totalDiscount.value
})

const getPdfUrl = (download = false) => {
  if (!props.payment?.id) return ''
  const baseUrl = config.public.baseUrl.endsWith('/')
    ? config.public.baseUrl
    : `${config.public.baseUrl}/`
  const dlParam = download ? '?download=1' : ''
  return `${baseUrl}finance/payment/pdf/${props.payment.id}${dlParam}`
}

const handleOpenPdf = () => {
  const url = getPdfUrl(false)
  if (url) {
    window.open(url, '_blank')
  }
}

const handleDownloadPdf = () => {
  const url = getPdfUrl(true)
  if (url) {
    const link = document.createElement('a')
    link.href = url
    link.download = `Bukti_Bayar_${String(props.payment?.id || '').slice(0, 8)}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

const handleDownloadImage = async () => {
  if (!receiptWrapperRef.value) return

  const targetElement = (receiptWrapperRef.value.querySelector('.receipt-sheet') ||
    receiptWrapperRef.value) as HTMLElement

  if (!targetElement) return

  try {
    isDownloadingImage.value = true
    const dataUrl = await toJpeg(targetElement, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true
    })

    const refNo = String(props.payment?.id || 'struk').slice(0, 8)
    const fileName = `Bukti_Bayar_${refNo}.jpeg`

    const link = document.createElement('a')
    link.download = fileName
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.add({
      title: 'Berhasil mengunduh gambar',
      description: `Struk bukti bayar telah diunduh (${fileName}).`,
      color: 'success'
    })
  } catch (err: any) {
    console.error('Download error:', err)
    toast.add({
      title: 'Gagal mengunduh gambar',
      description: err?.message || 'Terjadi kesalahan saat memproses gambar.',
      color: 'error'
    })
  } finally {
    isDownloadingImage.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :ui="{
      content: 'sm:max-w-4xl max-h-[92vh] flex flex-col'
    }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full pr-6">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-primary-50 text-primary-600">
            <UIcon name="i-lucide-receipt" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-gray-900">
              Struk Bukti Pembayaran (A4)
            </h3>
            <p class="text-xs text-gray-500 font-mono">
              Ref ID: <span class="font-bold text-gray-700">{{ payment?.id || '-' }}</span>
            </p>
          </div>
        </div>

        <UBadge
          color="success"
          variant="subtle"
          size="md"
          class="font-black tracking-wider uppercase"
        >
          Lunas / Paid
        </UBadge>
      </div>
    </template>

    <template #body>
      <div class="overflow-y-auto max-h-[68vh] p-2 sm:p-4 bg-neutral-100/70 rounded-xl border border-neutral-200">
        <!-- Visual A4 Paper Display Sheet -->
        <div ref="receiptWrapperRef" class="flex justify-center">
          <div
            class="receipt-sheet bg-white text-neutral-800 border border-neutral-300 rounded-md shadow-md p-6 sm:p-10 w-full max-w-[760px] select-none font-sans text-xs sm:text-sm"
          >
            <!-- Kop Header -->
            <div class="flex items-start justify-between border-b-2 border-red-700 pb-3 mb-4">
              <div class="space-y-1">
                <div class="flex items-baseline gap-2">
                  <span class="text-xl sm:text-2xl font-black font-serif text-red-700 tracking-wide">BUKIT WAHID</span>
                  <span class="text-xs text-neutral-600 font-sans tracking-tight">regency</span>
                </div>
                <div class="text-xs sm:text-sm font-bold text-neutral-900 tracking-wider">
                  ESTATE MANAGEMENT
                </div>
                <p class="text-[10px] sm:text-xs text-neutral-500 max-w-sm leading-tight">
                  Jl. Bukit Wahid Regency, Kel. Manyaran, Kec. Semarang Barat, Kota Semarang 50147 &bull; WA: 0812-2500-0080
                </p>
              </div>

              <div class="text-right space-y-1">
                <h2 class="text-base sm:text-lg font-black text-neutral-900 tracking-wider">
                  STRUK BUKTI BAYAR
                </h2>
                <p class="text-[10px] text-neutral-500 uppercase tracking-widest">
                  Official Payment Receipt
                </p>
                <div class="inline-block bg-emerald-50 text-emerald-700 border border-emerald-300 text-[11px] font-black px-3 py-0.5 rounded tracking-widest mt-1">
                  LUNAS / PAID
                </div>
              </div>
            </div>

            <!-- Metadata Transaksi & Warga -->
            <div class="bg-neutral-50 border border-neutral-200 rounded-lg p-3 sm:p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="space-y-1 sm:border-r sm:border-neutral-200 sm:pr-4">
                <div class="flex">
                  <span class="w-24 text-neutral-500">Nama Warga</span>
                  <span class="mx-1">:</span>
                  <span class="font-bold text-neutral-900">{{ payment?.person?.name || '-' }}</span>
                </div>
                <div class="flex">
                  <span class="w-24 text-neutral-500">Unit / Kavling</span>
                  <span class="mx-1">:</span>
                  <span class="font-bold text-neutral-900">{{ displayKavling }}</span>
                </div>
                <div class="flex">
                  <span class="w-24 text-neutral-500">No. Telepon</span>
                  <span class="mx-1">:</span>
                  <span class="font-medium text-neutral-800">{{ payment?.person?.phone || '-' }}</span>
                </div>
              </div>

              <div class="space-y-1 sm:pl-2">
                <div class="flex">
                  <span class="w-28 text-neutral-500">No. Transaksi</span>
                  <span class="mx-1">:</span>
                  <span class="font-mono font-bold text-neutral-900 text-[11px] truncate max-w-[160px]">
                    {{ payment?.id || '-' }}
                  </span>
                </div>
                <div class="flex">
                  <span class="w-28 text-neutral-500">Tanggal Bayar</span>
                  <span class="mx-1">:</span>
                  <span class="font-semibold text-neutral-900">{{ paymentDateFormatted }}</span>
                </div>
                <div class="flex">
                  <span class="w-28 text-neutral-500">Metode Bayar</span>
                  <span class="mx-1">:</span>
                  <span class="font-bold text-neutral-800 capitalize">
                    {{ payment?.type === 'cash' ? 'Tunai (Cash)' : (payment?.type === 'transfer' ? 'Transfer Bank' : (payment?.type || '-')) }}
                  </span>
                </div>
                <div class="flex">
                  <span class="w-28 text-neutral-500">Kasir / Petugas</span>
                  <span class="mx-1">:</span>
                  <span class="font-semibold text-neutral-900">{{ payment?.operator?.name || 'Admin Estate Management' }}</span>
                </div>
              </div>
            </div>

            <!-- Tabel Rincian Tagihan -->
            <div class="overflow-x-auto mb-4 border border-neutral-300 rounded-md">
              <table class="w-full text-left text-xs">
                <thead class="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-300 text-[11px]">
                  <tr>
                    <th class="py-2 px-2 text-center w-8">No</th>
                    <th class="py-2 px-3">Rincian Tagihan & Kalkulasi</th>
                    <th class="py-2 px-3 text-center">No. Kwitansi</th>
                    <th class="py-2 px-3 text-center">Periode</th>
                    <th class="py-2 px-3 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-200">
                  <tr
                    v-for="(detail, idx) in payment?.details || []"
                    :key="detail.id || idx"
                    class="hover:bg-neutral-50/50"
                  >
                    <td class="py-2 px-2 text-center text-neutral-500 align-top">{{ Number(idx) + 1 }}</td>
                    <td class="py-2 px-3 align-top space-y-1">
                      <!-- IPL Category -->
                      <template v-if="(detail.category || detail.bill?.category || '').toLowerCase() === 'ipl'">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-bold text-neutral-900">
                            Iuran Pemeliharaan Lingkungan (IPL)
                          </span>
                          <span
                            v-if="detail.bill?.residence?.type || detail.bill?.residence?.kavling"
                            class="inline-flex items-center text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300"
                          >
                            {{ [detail.bill.residence.type, detail.bill.residence.kavling].filter(Boolean).join(' - ') }}
                          </span>
                        </div>
                        <div class="p-2 rounded bg-emerald-50/60 border-l-2 border-emerald-500 text-[11px] text-neutral-700 space-y-0.5">
                          <div class="font-semibold text-emerald-900">
                            Perhitungan Luas Tanah:
                          </div>
                          <div>
                            Luas Tanah: <span class="font-bold">{{ formatNumber(detail.bill?.qty || 0) }} {{ detail.bill?.unit || 'm²' }}</span>
                            &times; Rp {{ formatNumber(detail.bill?.price || 0) }} / m²
                            = <span class="font-bold text-neutral-900">Rp {{ formatNumber((detail.bill?.qty || 0) * (detail.bill?.price || 0)) }}</span>
                          </div>
                          <div v-if="detail.bill?.penalty && Number(detail.bill.penalty) > 0" class="text-rose-600">
                            + Denda: Rp {{ formatNumber(detail.bill.penalty) }}
                          </div>
                          <div v-if="detail.bill?.discount && Number(detail.bill.discount) > 0" class="text-emerald-700">
                            - Diskon: Rp {{ formatNumber(detail.bill.discount) }}
                          </div>
                        </div>
                      </template>

                      <!-- PAM / Artesis Category -->
                      <template v-else-if="(detail.category || detail.bill?.category || '').toLowerCase() === 'pam'">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-bold text-neutral-900">
                            Air Artetis (PAM)
                          </span>
                          <span
                            v-if="detail.bill?.residence?.type || detail.bill?.residence?.kavling"
                            class="inline-flex items-center text-[11px] font-semibold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-md border border-sky-300"
                          >
                            {{ [detail.bill.residence.type, detail.bill.residence.kavling].filter(Boolean).join(' - ') }}
                          </span>
                        </div>
                        <div class="p-2 rounded bg-sky-50/60 border-l-2 border-sky-500 text-[11px] text-neutral-700 space-y-0.5">
                          <div class="font-semibold text-sky-900">
                            Kalkulasi Meteran:
                          </div>
                          <div class="flex items-center gap-3">
                            <span>Stan Awal: <strong class="font-mono">{{ detail.bill?.pam_before !== null && detail.bill?.pam_before !== undefined ? detail.bill.pam_before : '-' }}</strong></span>
                            <span>Stan Akhir: <strong class="font-mono">{{ detail.bill?.pam_after !== null && detail.bill?.pam_after !== undefined ? detail.bill.pam_after : '-' }}</strong></span>
                          </div>
                          <div>
                            Pemakaian: <span class="font-bold">{{ formatNumber(detail.bill?.qty || 0) }} {{ detail.bill?.unit || 'm³' }}</span>
                            &times; Rp {{ formatNumber(detail.bill?.price || 3000) }} / m³
                            = <span class="font-bold text-neutral-900">Rp {{ formatNumber((detail.bill?.qty || 0) * (detail.bill?.price || 3000)) }}</span>
                          </div>
                          <div v-if="detail.bill?.penalty && Number(detail.bill.penalty) > 0" class="text-rose-600">
                            + Denda: Rp {{ formatNumber(detail.bill.penalty) }}
                          </div>
                          <div v-if="detail.bill?.discount && Number(detail.bill.discount) > 0" class="text-emerald-700">
                            - Diskon: Rp {{ formatNumber(detail.bill.discount) }}
                          </div>
                        </div>
                      </template>

                      <!-- Dues / Iuran RW Category -->
                      <template v-else-if="(detail.category || detail.bill?.category || '').toLowerCase() === 'dues'">
                        <div class="font-bold text-neutral-900">
                          Iuran RW XI
                        </div>
                        <div class="text-[11px] text-neutral-600">
                          {{ detail.bill?.description || 'Iuran wajib bulanan warga RW XI Bukit Wahid Regency' }}
                        </div>
                        <div v-if="detail.bill?.penalty && Number(detail.bill.penalty) > 0" class="text-rose-600 text-[11px] pt-0.5">
                          + Denda: Rp {{ formatNumber(detail.bill.penalty) }}
                        </div>
                        <div v-if="detail.bill?.discount && Number(detail.bill.discount) > 0" class="text-emerald-700 text-[11px] pt-0.5">
                          - Diskon: Rp {{ formatNumber(detail.bill.discount) }}
                        </div>
                      </template>

                      <!-- Other Category -->
                      <template v-else>
                        <div class="font-bold text-neutral-900">
                          Tagihan Lainnya
                        </div>
                        <div class="text-[11px] text-neutral-600">
                          {{ detail.bill?.description || 'Pembayaran tagihan lainnya' }}
                          <span v-if="detail.bill?.qty && detail.bill?.price" class="block text-[10px] text-neutral-500">
                            ({{ detail.bill.qty }} {{ detail.bill.unit || 'item' }} &times; Rp {{ formatNumber(detail.bill.price) }})
                          </span>
                        </div>
                        <div v-if="detail.bill?.penalty && Number(detail.bill.penalty) > 0" class="text-rose-600 text-[11px] pt-0.5">
                          + Denda: Rp {{ formatNumber(detail.bill.penalty) }}
                        </div>
                        <div v-if="detail.bill?.discount && Number(detail.bill.discount) > 0" class="text-emerald-700 text-[11px] pt-0.5">
                          - Diskon: Rp {{ formatNumber(detail.bill.discount) }}
                        </div>
                      </template>
                    </td>

                    <td class="py-2 px-3 text-center align-top font-mono font-bold text-red-700 text-xs">
                      {{ detail.bill?.no_kwitansi || '-' }}
                    </td>

                    <td class="py-2 px-3 text-center align-top font-medium text-neutral-700 text-xs">
                      {{ detail.bill?.bill_date ? formatYearMonth(detail.bill.bill_date) : '-' }}
                    </td>

                    <td class="py-2 px-3 text-right align-top font-bold text-neutral-900 text-xs">
                      {{ formatCurrency(detail.amount) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Total & Terbilang -->
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6">
              <div class="sm:col-span-7 bg-neutral-50 border border-neutral-200 rounded p-3 text-xs space-y-1">
                <span class="text-neutral-500 font-semibold block text-[10px] uppercase tracking-wider">Terbilang:</span>
                <p class="font-serif italic font-bold text-neutral-900">
                  # {{ terbilangFormatted }} #
                </p>
              </div>

              <div class="sm:col-span-5 border-2 border-neutral-800 rounded bg-neutral-50/80 p-3 flex flex-col justify-between space-y-1">
                <!-- Breakdown if penalty or discount exists -->
                <div v-if="totalPenalty > 0 || totalDiscount > 0" class="space-y-1 text-xs border-b border-neutral-200 pb-1.5 mb-1">
                  <div class="flex items-center justify-between text-neutral-600">
                    <span>Subtotal Pokok</span>
                    <span class="font-medium">{{ formatCurrency(totalPokok) }}</span>
                  </div>
                  <div v-if="totalPenalty > 0" class="flex items-center justify-between text-rose-600">
                    <span>Total Denda (+)</span>
                    <span class="font-bold">+ {{ formatCurrency(totalPenalty) }}</span>
                  </div>
                  <div v-if="totalDiscount > 0" class="flex items-center justify-between text-emerald-700">
                    <span>Total Diskon (-)</span>
                    <span class="font-bold">- {{ formatCurrency(totalDiscount) }}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between text-xs text-neutral-600">
                  <span class="font-bold uppercase tracking-wider">TOTAL BAYAR</span>
                </div>
                <div class="text-lg sm:text-xl font-black text-red-700 font-mono text-right">
                  {{ formatCurrency(payment?.amount) }}
                </div>
              </div>
            </div>

            <!-- Notes & Signature Footer -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-dashed border-neutral-300 text-xs">
              <div class="text-[11px] text-neutral-500 space-y-1">
                <strong class="text-neutral-700 block">Catatan & Ketentuan:</strong>
                <ul class="list-disc list-inside space-y-0.5">
                  <li>Struk ini adalah bukti pembayaran sah yang dikeluarkan oleh sistem Estate Management Bukit Wahid Regency.</li>
                  <li>Simpan struk pembayaran ini sebagai tanda bukti pelunasan yang sah.</li>
                </ul>
              </div>

              <div class="text-center space-y-1 text-xs">
                <p class="text-neutral-600">
                  Semarang, {{ paymentDateOnly }}
                </p>
                <p class="font-bold text-neutral-800">
                  Estate Management Bukit Wahid Regency
                </p>
                <div class="h-12 flex items-center justify-center">
                  <!-- Ruang tanda tangan / stempel -->
                  <span class="text-[10px] text-neutral-300 italic">( Tanda Tangan / Stempel Digital )</span>
                </div>
                <p class="font-bold text-neutral-900 underline">
                  {{ payment?.operator?.name || 'Admin Estate Management' }}
                </p>
              </div>
            </div>

            <div class="mt-4 pt-2 border-t border-dotted border-neutral-300 text-right text-[10px] text-neutral-400">
              Dicetak otomatis oleh Sistem Manajemen BWR &bull; Format Standar HVS / A4
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <UButton
          variant="ghost"
          color="neutral"
          label="Tutup"
          @click="isOpen = false"
        />

        <div class="flex items-center gap-2">
          <!-- Unduh JPEG (WhatsApp ready) -->
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-image"
            :loading="isDownloadingImage"
            label="Unduh Gambar"
            @click="handleDownloadImage"
          />

          <!-- Buka Tab PDF (Untuk Print Langsung) -->
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-printer"
            label="Cetak / Buka PDF"
            @click="handleOpenPdf"
          />

          <!-- Unduh PDF A4 Resmi -->
          <UButton
            color="primary"
            icon="i-lucide-download"
            label="Unduh PDF (A4)"
            @click="handleDownloadPdf"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
