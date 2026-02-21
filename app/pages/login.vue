<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const router = useRouter()
// const { startLoading, stopLoading } = useAppLoading()
const { setTokens, setUser } = useAuth()
const toast = useToast()

definePageMeta({
  layout: 'blank'
})

const isPasswordVisible = ref(false)
const isLoading = ref(false)

const formState = reactive({
  email: 'sa@bukitwahid.com',
  password: 'bukitwahid@2026!'
})

const schema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z.string().min(5, 'Password minimal 5 karakter')
})

type Schema = z.output<typeof schema>

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  isLoading.value = true
  // startLoading()
  try {
    const response = await useApi<any>('/login', {
      method: 'POST',
      body: {
        username: event.data.email,
        password: event.data.password
      }
    })

    const { auth, user: userData } = response.data

    setTokens(auth.access_token, auth.refresh.token)
    setUser(userData)

    toast.add({ title: 'Login Berhasil', color: 'success' })
    // stopLoading()
    router.push('/dashboard')
  } catch (err: any) {
    toast.add({
      title: 'Login Gagal',
      description: err?.message || 'Terjadi kesalahan sistem',
      color: 'error'
    })
  } finally {
    // stopLoading()
    isLoading.value = false
  }
}
</script>

<template>
  <UCard
    class="bg-white/50 text-black rounded-xl border-0 backdrop-blur-sm shadow-sm min-w-md"
  >
    <NuxtLink to="/">
      <AppLogo class="w-auto mx-auto h-14 mb-4 shrink-0" />
    </NuxtLink>

    <div class="text-center font-bold text-lg">Masuk ke Akun Anda</div>
    <p class="text-center text-sm text-neutral-600">
      Silahkan masukan detail login anda
    </p>

    <UForm
      :schema="schema"
      :state="formState"
      class="flex flex-col gap-4 mt-8"
      @submit="onSubmit"
    >
      <!-- EMAIL -->
      <UFormField name="email" required>
        <UInput
          v-model="formState.email"
          type="email"
          placeholder="masukan email anda"
          icon="i-lucide-mail"
        />
      </UFormField>

      <!-- PASSWORD -->
      <UFormField name="password" required>
        <UInput
          v-model="formState.password"
          :type="isPasswordVisible ? 'text' : 'password'"
          placeholder="masukan password anda"
          class="w-full"
          icon="i-lucide-lock"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="ghost"
              :icon="isPasswordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              @click="isPasswordVisible = !isPasswordVisible"
            />
          </template>
        </UInput>
      </UFormField>

      <UButton :loading="isLoading" type="submit" class="mt-4 w-full">
        <span class="mx-auto">Login</span>
      </UButton>
      <!-- <span>v1.2.0</span> -->
    </UForm>
  </UCard>
</template>
