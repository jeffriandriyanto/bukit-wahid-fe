<script setup lang="ts">
import { z } from 'zod'

const toast = useToast()
const loading = ref(false)

// Schema Validasi sesuai flat object dari backend
const EnvironmentSchema = z.object({
  dues: z.number().min(0, 'Minimal 0'),
  due_billing_day: z.number().min(1).max(31, 'Tanggal 1-31'),
  ipl_cost: z.number().min(0, 'Minimal 0'),
  ipl_billing_day: z.number().min(1).max(31, 'Tanggal 1-31'),
  pam_cost: z.number().min(0, 'Minimal 0')
})

type EnvironmentSchema = z.infer<typeof EnvironmentSchema>

const form = reactive<EnvironmentSchema>({
  dues: 0,
  due_billing_day: 1,
  ipl_cost: 0,
  ipl_billing_day: 1,
  pam_cost: 0
})

/* =========================
  LOGIC HANDLERS
========================= */

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/finance/environment', { method: 'GET' })
    if (res.status === 1 && res.data) {
      Object.assign(form, res.data)
    }
  } catch (err) {
    console.error('Gagal fetch data:', err)
    toast.add({ title: 'Gagal memuat data master', color: 'error' })
  } finally {
    loading.value = false
  }
}

const updateData = async (event: any) => {
  loading.value = true
  try {
    const res = await useApi<any>('/finance/environment', {
      method: 'POST',
      body: event.data
    })

    if (res.status === 1) {
      toast.add({ title: 'Konfigurasi berhasil diperbarui', color: 'success' })
      getData() // Refresh data terbaru
    }
  } catch (err: any) {
    toast.add({ title: 'Gagal memperbarui konfigurasi', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(() => getData())
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Master Konfigurasi Tagihan
        </h1>
        <p class="text-sm text-gray-500">
          Atur nominal iuran dan tanggal penagihan otomatis di sini.
        </p>
      </div>
      <UBadge
        v-if="loading"
        color="primary"
        variant="subtle"
        class="animate-pulse"
      >
        Menyinkronkan...
      </UBadge>
    </div>

    <UForm
      :schema="EnvironmentSchema"
      :state="form"
      class="space-y-6"
      @submit="updateData"
    >
      <UCard :ui="{ body: 'p-6', header: 'bg-gray-50/50 py-3' }">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-home" class="text-primary-600 w-5 h-5" />
            <span class="font-bold text-gray-700">Konfigurasi IPL</span>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UFormField name="ipl_cost" label="Biaya IPL (Rp)">
            <UInput
              v-model.number="form.ipl_cost"
              type="number"
              icon="i-lucide-banknote"
              block
            />
          </UFormField>

          <UFormField name="ipl_billing_day" label="Tanggal Penagihan IPL">
            <UInput
              v-model.number="form.ipl_billing_day"
              type="number"
              placeholder="1-31"
              block
            />
            <template #help
              >Tagihan muncul setiap tanggal yang dipilih setiap
              bulannya.</template
            >
          </UFormField>
        </div>
      </UCard>

      <UCard :ui="{ body: 'p-6', header: 'bg-gray-50/50 py-3' }">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-users" class="text-blue-600 w-5 h-5" />
            <span class="font-bold text-gray-700">Iuran RW / Dues</span>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UFormField name="dues" label="Nominal Iuran (Rp)">
            <UInput
              v-model.number="form.dues"
              type="number"
              icon="i-lucide-banknote"
              block
            />
          </UFormField>

          <UFormField name="due_billing_day" label="Tanggal Penagihan Iuran">
            <UInput
              v-model.number="form.due_billing_day"
              type="number"
              placeholder="1-31"
              block
            />
          </UFormField>
        </div>
      </UCard>

      <UCard :ui="{ body: 'p-6', header: 'bg-gray-50/50 py-3' }">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-droplets" class="text-cyan-600 w-5 h-5" />
            <span class="font-bold text-gray-700">Harga Air (PAM)</span>
          </div>
        </template>

        <div class="grid grid-cols-1">
          <UFormField name="pam_cost" label="Harga per m³ (Kubik)">
            <UInput
              v-model.number="form.pam_cost"
              type="number"
              icon="i-lucide-gauge"
              class="max-w-md"
            />
            <template #help
              >Harga ini akan dikalikan dengan selisih pemakaian meteran air
              warga.</template
            >
          </UFormField>
        </div>
      </UCard>

      <div
        class="flex items-center justify-end gap-4 pt-4 border-t border-gray-100"
      >
        <UButton
          variant="ghost"
          color="neutral"
          :disabled="loading"
          @click="getData"
        >
          Reset Perubahan
        </UButton>
        <UButton
          type="submit"
          color="primary"
          size="lg"
          icon="i-lucide-save"
          :loading="loading"
          class="px-8"
        >
          Simpan Konfigurasi
        </UButton>
      </div>
    </UForm>
  </div>
</template>
