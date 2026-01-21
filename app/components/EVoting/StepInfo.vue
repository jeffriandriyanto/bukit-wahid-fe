<script setup lang="ts">
import { format } from 'date-fns'
import {
  toCalendarDate,
  fromDate,
  today,
  getLocalTimeZone,
  Time
} from '@internationalized/date'
import type { CalendarDate } from '@internationalized/date'

const props = defineProps<{ modelValue: any }>()
const rtItems = ['Semua RT', 'RT 01', 'RT 02', 'RT 03', 'RT 04']

// Internal UI State untuk Date/Time agar tidak mengotori parent
const dateObject = ref<CalendarDate>()
const timeObject = ref(new Time(0, 0))
const fileUpload = ref<File[]>([])

// Init Data saat Edit Mode
watch(
  () => props.modelValue,
  (val) => {
    if (val.date && !dateObject.value) {
      const d = new Date(val.date)
      dateObject.value = toCalendarDate(fromDate(d, getLocalTimeZone()))
    }
    if (
      val.time &&
      timeObject.value.hour === 0 &&
      timeObject.value.minute === 0
    ) {
      const [h, m] = val.time.split(':').map(Number)
      timeObject.value = new Time(h, m)
    }
  },
  { immediate: true }
)

// Sync ke Parent
watch([dateObject, timeObject], () => {
  if (dateObject.value) props.modelValue.date = dateObject.value.toString()
  props.modelValue.time = timeObject.value.toString().slice(0, 5)
})

const handleImage = (files: File[]) => {
  if (!files.length) return
  if (props.modelValue.image?.startsWith('blob:'))
    URL.revokeObjectURL(props.modelValue.image)
  props.modelValue.image = URL.createObjectURL(files[0])
}

const clearImage = () => {
  if (props.modelValue.image?.startsWith('blob:'))
    URL.revokeObjectURL(props.modelValue.image)
  props.modelValue.image = ''
  fileUpload.value = []
}
</script>

<template>
  <div class="space-y-4 pt-4">
    <UFormField name="title" label="Judul Voting" required>
      <UInput
        v-model="modelValue.title"
        placeholder="Contoh: Pemilihan Ketua Karang Taruna"
      />
    </UFormField>

    <UFormField name="shown" label="Target Wilayah">
      <USelect v-model="modelValue.shown" :items="rtItems" class="w-full" />
    </UFormField>

    <div class="grid grid-cols-2 gap-4">
      <UFormField name="date" label="Batas Tanggal">
        <UPopover>
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-calendar"
            class="w-full justify-start"
          >
            {{
              dateObject
                ? format(new Date(dateObject.toString()), 'dd MMMM yyyy')
                : 'Pilih Tanggal'
            }}
          </UButton>
          <template #content><UCalendar v-model="dateObject" /></template>
        </UPopover>
      </UFormField>

      <UFormField name="time" label="Jam Selesai">
        <UInputTime v-model="timeObject" />
      </UFormField>
    </div>

    <UFormField label="Banner Voting">
      <div
        v-if="modelValue.image"
        class="relative aspect-video rounded-lg overflow-hidden border"
      >
        <img :src="modelValue.image" class="w-full h-full object-cover" />
        <div
          class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition"
        >
          <UButton
            color="error"
            size="xs"
            icon="i-lucide-trash-2"
            @click="clearImage"
            >Hapus Gambar</UButton
          >
        </div>
      </div>
      <UFileUpload
        v-else
        v-model="fileUpload"
        accept="image/*"
        class="aspect-video"
        @update:model-value="handleImage"
      />
    </UFormField>
  </div>
</template>
