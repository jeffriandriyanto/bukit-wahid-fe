<script setup lang="ts">
import { z } from 'zod'

const toast = useToast()
const loading = ref(false)

/* =========================
  SCHEMA & STATE
========================= */
const WebsiteConfigSchema = z.object({
  address: z.string().min(1, { error: 'Alamat wajib diisi' }),
  greeting: z.string().optional(),
  whatsapp: z.string().min(1, { error: 'Nomor WA wajib diisi' }),
  email: z.string().email({ error: 'Format email tidak valid' }),
  instagram: z.string().optional(),
  youtube: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  fasum: z.array(z.string()).default([]),
  kegiatan: z.array(z.string()).default([])
})

type WebsiteConfigSchema = z.infer<typeof WebsiteConfigSchema>

const form = reactive<WebsiteConfigSchema>({
  address: '',
  greeting: '',
  whatsapp: '',
  email: '',
  instagram: '',
  youtube: '',
  facebook: '',
  twitter: '',
  fasum: [],
  kegiatan: []
})

/* =========================
  TRANSFORMERS (Key-Value Helpers)
========================= */

// Mengubah [{key, value}] dari API menjadi flat object untuk Form
const transformToForm = (apiData: { key: string; value: any }[]) => {
  apiData.forEach((item) => {
    if (item.key in form) {
      // Handle array data (fasum & kegiatan) jika disimpan sebagai string JSON atau array murni
      if (Array.isArray(form[item.key as keyof WebsiteConfigSchema])) {
        form[item.key as keyof WebsiteConfigSchema] =
          typeof item.value === 'string' ? JSON.parse(item.value) : item.value
      } else {
        form[item.key as keyof WebsiteConfigSchema] = item.value
      }
    }
  })
}

// Mengubah flat object Form menjadi [{key, value}] untuk API
const transformToApi = (formData: WebsiteConfigSchema) => {
  return Object.entries(formData).map(([key, value]) => ({
    key: key,
    value: value // Backend bisa handle stringify jika diperlukan
  }))
}

/* =========================
  LOGIC HANDLERS
========================= */

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/settings/website', { method: 'GET' })
    if (res.status === 1 && res.data) {
      transformToForm(res.data)
    }
  } catch (err: any) {
    toast.add({ title: err.message || 'Gagal memuat konfigurasi', color: 'error' })
  } finally {
    loading.value = false
  }
}

const updateData = async (event: any) => {
  loading.value = true
  try {
    const payload = transformToApi(event.data)

    const res = await useApi<any>('/settings/website', {
      method: 'POST',
      body: { settings: payload } // Membungkus array ke dalam object jika API butuh
    })

    if (res.status === 1) {
      toast.add({ title: 'Data berhasil diperbarui', color: 'success' })
      getData()
    }
  } catch (err: any) {
    toast.add({ title: err.message || 'Gagal memperbarui data', color: 'error' })
  } finally {
    loading.value = false
  }
}

// Helper untuk menambah/menghapus list (Fasum/Kegiatan)
const addItem = (field: 'fasum' | 'kegiatan') => {
  form[field].push('')
}
const removeItem = (field: 'fasum' | 'kegiatan', index: number) => {
  form[field].splice(index, 1)
}

onMounted(() => getData())
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Konfigurasi Konten & Publik
        </h1>
        <p class="text-sm text-gray-500">
          Kelola informasi yang tampil di halaman depan website.
        </p>
      </div>
      <UBadge
        v-if="loading"
        color="primary"
        variant="subtle"
        class="animate-pulse"
        >Loading...</UBadge
      >
    </div>

    <UForm
      :schema="WebsiteConfigSchema"
      :state="form"
      class="space-y-6"
      @submit="updateData"
    >
      <UCard>
        <template #header>
          <div class="flex items-center gap-2 font-bold">
            <UIcon name="i-lucide-info" class="text-primary-500" /> Profil
            Sekretariat
          </div>
        </template>

        <div class="space-y-4">
          <UFormField name="address" label="Alamat Sekretariat">
            <UTextarea
              v-model="form.address"
              placeholder="Jl. Raya Nomor..."
              block
            />
          </UFormField>

          <UFormField name="greeting" label="Sambutan Ketua / Admin">
            <UTextarea
              v-model="form.greeting"
              :rows="5"
              placeholder="Selamat datang di..."
              block
            />
          </UFormField>
        </div>
      </UCard>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UCard>
          <template #header
            ><span class="font-bold">Hubungi Kami</span></template
          >
          <div class="space-y-4">
            <UFormField name="whatsapp" label="WhatsApp Admin">
              <UInput
                v-model="form.whatsapp"
                icon="i-lucide-phone"
                placeholder="628123..."
              />
            </UFormField>
            <UFormField name="email" label="Email Admin">
              <UInput
                v-model="form.email"
                icon="i-lucide-mail"
                placeholder="admin@mail.com"
              />
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header
            ><span class="font-bold">Media Sosial</span></template
          >
          <div class="grid grid-cols-1 gap-4">
            <UInput
              v-model="form.instagram"
              icon="i-lucide-instagram"
              placeholder="Link Instagram"
            />
            <UInput
              v-model="form.youtube"
              icon="i-lucide-youtube"
              placeholder="Link Channel YouTube"
            />
            <UInput
              v-model="form.facebook"
              icon="i-lucide-facebook"
              placeholder="Link Page Facebook"
            />
            <UInput
              v-model="form.twitter"
              icon="i-lucide-x"
              placeholder="Link X"
            />
          </div>
        </UCard>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">Fasilitas Umum</span>
              <UButton
                size="xs"
                color="neutral"
                icon="i-lucide-plus"
                @click="addItem('fasum')"
                >Tambah</UButton
              >
            </div>
          </template>
          <div class="space-y-2">
            <div
              v-for="(_, index) in form.fasum"
              :key="index"
              class="flex gap-2"
            >
              <UInput
                v-model="form.fasum[index]"
                class="flex-1"
                placeholder="Nama Fasilitas"
              />
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash"
                @click="removeItem('fasum', index)"
              />
            </div>
            <p
              v-if="form.fasum.length === 0"
              class="text-sm text-gray-400 text-center py-4"
            >
              Belum ada fasilitas ditambahkan.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">Daftar Kegiatan</span>
              <UButton
                size="xs"
                color="neutral"
                icon="i-lucide-plus"
                @click="addItem('kegiatan')"
                >Tambah</UButton
              >
            </div>
          </template>
          <div class="space-y-2">
            <div
              v-for="(_, index) in form.kegiatan"
              :key="index"
              class="flex gap-2"
            >
              <UInput
                v-model="form.kegiatan[index]"
                class="flex-1"
                placeholder="Nama Kegiatan"
              />
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash"
                @click="removeItem('kegiatan', index)"
              />
            </div>
            <p
              v-if="form.kegiatan.length === 0"
              class="text-sm text-gray-400 text-center py-4"
            >
              Belum ada kegiatan ditambahkan.
            </p>
          </div>
        </UCard>
      </div>

      <div class="flex justify-end gap-3 border-t pt-6">
        <UButton variant="ghost" color="neutral" @click="getData"
          >Batal</UButton
        >
        <UButton
          type="submit"
          color="primary"
          :loading="loading"
          icon="i-lucide-save"
          >Simpan Perubahan</UButton
        >
      </div>
    </UForm>
  </div>
</template>
