<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const isOldVisible = ref(false)
const isNewVisible = ref(false)
const isConfirmVisible = ref(false)

const formState = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const schema = z
  .object({
    oldPassword: z.string().min(5, 'Password lama minimal 5 karakter'),
    newPassword: z.string().min(5, 'Password baru minimal 5 karakter'),
    confirmPassword: z.string().min(5, 'Konfirmasi password wajib diisi')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password tidak sama',
    path: ['confirmPassword']
  })

type Schema = z.output<typeof schema>

const close = () => {
  emit('update:open', false)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  const { oldPassword, newPassword } = event.data

  // nanti sambung API di sini
  console.log('change password payload', {
    oldPassword,
    newPassword
  })

  formState.confirmPassword = ''
  formState.newPassword = ''
  formState.oldPassword = ''

  emit('update:open', false)
}
</script>

<template>
  <UModal :open="props.open" @update:open="emit('update:open', $event)">
    <template #header>
      <h3 class="text-lg font-semibold">Ganti Password</h3>
    </template>

    <template #body>
      <UForm
        :schema="schema"
        :state="formState"
        class="space-y-4"
        @submit="onSubmit"
      >
        <!-- PASSWORD LAMA -->
        <UFormField label="Password Lama" name="oldPassword" required>
          <UInput
            v-model="formState.oldPassword"
            :type="isOldVisible ? 'text' : 'password'"
            icon="i-lucide-lock"
            placeholder="Masukkan password lama"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="ghost"
                :icon="isOldVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                @click="isOldVisible = !isOldVisible"
              />
            </template>
          </UInput>
        </UFormField>

        <!-- PASSWORD BARU -->
        <UFormField label="Password Baru" name="newPassword" required>
          <UInput
            v-model="formState.newPassword"
            :type="isNewVisible ? 'text' : 'password'"
            icon="i-lucide-key"
            placeholder="Masukkan password baru"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="ghost"
                :icon="isNewVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                @click="isNewVisible = !isNewVisible"
              />
            </template>
          </UInput>
        </UFormField>

        <!-- KONFIRMASI PASSWORD -->
        <UFormField label="Konfirmasi Password" name="confirmPassword" required>
          <UInput
            v-model="formState.confirmPassword"
            :type="isConfirmVisible ? 'text' : 'password'"
            icon="i-lucide-check"
            placeholder="Konfirmasi password baru"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="ghost"
                :icon="isConfirmVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                @click="isConfirmVisible = !isConfirmVisible"
              />
            </template>
          </UInput>
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" type="button" @click="close">
            Batal
          </UButton>

          <UButton color="primary" type="submit"> Simpan </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
