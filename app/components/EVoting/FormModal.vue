<script setup lang="ts">
import { Step1Schema, EVotingFormSchema, type EVotingForm } from '~/utils/schemas/evoting'

const props = defineProps<{
  open: boolean
  initialData?: EVotingForm | null
}>()

const emit = defineEmits(['update:open', 'save'])

const formRef = useTemplateRef('formRef')
const stepper = useTemplateRef('stepper')

const defaultForm: EVotingForm = {
  title: '', shown: 'Semua RT', date: '', time: '00:00', image: '',
  candidate: [{ name: '', vision: '', poster: '' }, { name: '', vision: '', poster: '' }]
}

const form = reactive<EVotingForm>({ ...defaultForm })

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    if (props.initialData) {
      Object.assign(form, JSON.parse(JSON.stringify(props.initialData)))
    } else {
      Object.assign(form, JSON.parse(JSON.stringify(defaultForm)))
    }
    if (stepper.value) stepper.value.step = 0
  }
})

const nextStep = async () => {
  const result = Step1Schema.safeParse(form)
  if (result.success) {
    stepper.value?.next()
  } else {
    formRef.value?.validate(['title', 'shown', 'date', 'time'])
  }
}

const onSubmit = () => {
  emit('save', { ...form })
}
</script>

<template>
  <UModal :open="open" @update:open="$emit('update:open', $event)" :ui="{ content: 'max-w-2xl' }">
    <template #header>
      <h3 class="text-lg font-semibold">{{ initialData ? 'Edit' : 'Tambah' }} E-Voting</h3>
    </template>
    <template #body>
      <UForm ref="formRef" :schema="EVotingFormSchema" :state="form" class="space-y-4" @submit="onSubmit">
        <UStepper ref="stepper" size="xs" :items="[{ title: 'Informasi', slot: 'one' }, { title: 'Kandidat', slot: 'two' }]">

          <template #one>
            <EVotingStepInfo v-model="form" />
            <div class="flex justify-end mt-6">
              <UButton label="Lanjut ke Kandidat" trailing-icon="i-lucide-arrow-right" @click="nextStep" />
            </div>
          </template>

          <template #two>
            <EVotingStepCandidate v-model="form" />
            <div class="flex justify-between mt-6">
              <UButton variant="outline" label="Kembali" @click="stepper?.prev()" />
              <UButton type="submit" color="primary" label="Simpan Voting" />
            </div>
          </template>

        </UStepper>
      </UForm>
    </template>
  </UModal>
</template>
