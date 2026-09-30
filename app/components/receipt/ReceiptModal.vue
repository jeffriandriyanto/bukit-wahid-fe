<script setup lang="ts">
import { toJpeg } from 'html-to-image'
import ReceiptDues from './ReceiptDues.vue'
import ReceiptEstate from './ReceiptEstate.vue'

interface Props {
  modelValue: boolean
  bill: any
  residentName?: string
  residentAddress?: string
  residentKavling?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])

const toast = useToast()
const receiptWrapperRef = ref<HTMLElement | null>(null)
const isDownloading = ref(false)

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const currentTemplate = ref<'dues' | 'estate'>('dues')

// Set template automatically based on bill category
watch(
  () => props.bill,
  (newBill) => {
    if (!newBill) return
    const cat = (newBill.category || '').toLowerCase()
    if (cat === 'ipl' || cat === 'pam') {
      currentTemplate.value = 'estate'
    } else {
      currentTemplate.value = 'dues'
    }
  },
  { immediate: true }
)

const downloadImage = async () => {
  if (!receiptWrapperRef.value) return
  
  // Find inner receipt element (to avoid modal wrappers/scrollbars)
  const targetElement = (receiptWrapperRef.value.querySelector('.receipt-container') ||
    receiptWrapperRef.value.querySelector('.receipt-estate') ||
    receiptWrapperRef.value) as HTMLElement

  if (!targetElement) return

  try {
    isDownloading.value = true
    const dataUrl = await toJpeg(targetElement, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true
    })

    const noKwitansi = props.bill?.no_kwitansi || 'Nota'
    const category = props.bill?.category || 'Tagihan'
    const fileName = `Kwitansi_${noKwitansi}_${category}.jpeg`

    const link = document.createElement('a')
    link.download = fileName
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.add({
      title: 'Berhasil',
      description: `Kwitansi ${noKwitansi} berhasil diunduh.`,
      color: 'success'
    })
  } catch (err: any) {
    console.error('Download error:', err)
    toast.add({
      title: 'Gagal mengunduh kwitansi',
      description: err?.message || 'Terjadi kesalahan saat memproses gambar.',
      color: 'error'
    })
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :ui="{
      content: 'sm:max-w-4xl'
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
              Preview Kwitansi Pembayaran
            </h3>
            <p class="text-xs text-gray-500">
              No. Kwitansi: <span class="font-mono font-bold text-gray-700">{{ bill?.no_kwitansi || '-' }}</span>
            </p>
          </div>
        </div>

        <UBadge
          :color="currentTemplate === 'estate' ? 'primary' : 'neutral'"
          variant="subtle"
          class="font-semibold text-xs"
        >
          {{ currentTemplate === 'estate' ? 'Nota EM (IPL / PAM)' : 'Nota RW (Iuran / Lainnya)' }}
        </UBadge>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <!-- Receipt Canvas Display Area -->
        <div class="bg-neutral-100/80 p-4 sm:p-6 rounded-2xl flex items-center justify-center overflow-x-auto border border-neutral-200">
          <div ref="receiptWrapperRef" class="scale-[0.75] sm:scale-90 md:scale-100 origin-center transition-transform">
            <ReceiptEstate
              v-if="currentTemplate === 'estate'"
              :bill="bill"
              :resident-name="residentName"
              :resident-kavling="residentKavling"
            />
            <ReceiptDues
              v-else
              :bill="bill"
              :resident-name="residentName"
              :resident-address="residentAddress"
            />
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
          <UButton
            color="primary"
            icon="i-lucide-download"
            :loading="isDownloading"
            label="Unduh Gambar (JPEG)"
            @click="downloadImage"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
