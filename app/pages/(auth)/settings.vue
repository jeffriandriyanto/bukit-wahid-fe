<script setup lang="ts">
import { z } from 'zod'
import { fileUpload } from '~/services/files' // Pastikan service upload di-import

const toast = useToast()
const loading = ref(false)
const initialForm = ref<string>('')

// Ref untuk menampung file banner mentah
const bannerFile = ref<File | null>(null)

/* =========================
  SCHEMA & STATE
========================= */
const WebsiteConfigSchema = z.object({
  address: z.string().min(1, { message: 'Alamat wajib diisi' }),
  greeting: z.string().nullable().optional(),
  whatsapp: z.string().min(1, { message: 'Nomor WA wajib diisi' }),
  email: z.string().email({ message: 'Format email tidak valid' }),
  instagram: z.string().nullable().optional(),
  youtube: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  twitter: z.string().nullable().optional(),
  fasum: z.array(z.string()).default([]),
  kegiatan: z.array(z.string()).default([]),
  // New Env Fields
  hero_banner: z.string().nullable().optional(),
  link_googleplay: z.string().nullable().optional()
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
  kegiatan: [],
  hero_banner: '',
  link_googleplay: ''
})

/* =========================
  TRANSFORMERS
========================= */

const transformToForm = (apiData: any[]) => {
  apiData.forEach((item) => {
    const key = Object.keys(item)[0]
    let value = item[key]

    if (key in form) {
      if (!value) {
        form[key as keyof WebsiteConfigSchema] = Array.isArray(
          form[key as keyof WebsiteConfigSchema]
        )
          ? []
          : ''
        return
      }

      const unescape = (str: string) =>
        str.replace(/&#34;/g, '"').replace(/&nbsp;/g, ' ')

      if (Array.isArray(form[key as keyof WebsiteConfigSchema])) {
        try {
          const sanitized = typeof value === 'string' ? unescape(value) : value
          form[key as keyof WebsiteConfigSchema] =
            typeof sanitized === 'string' ? JSON.parse(sanitized) : sanitized
        } catch (e) {
          form[key as keyof WebsiteConfigSchema] = []
        }
      } else {
        form[key as keyof WebsiteConfigSchema] =
          typeof value === 'string' ? unescape(value) : value
      }
    }
  })
}

/* =========================
  LOGIC HANDLERS
========================= */

const getData = async () => {
  loading.value = true
  try {
    const res = await useApi<any>('/environment', { method: 'GET' })
    if (res.status === 1 && res.data?.data) {
      transformToForm(res.data.data)
      initialForm.value = JSON.stringify(form)
    }
  } catch (err: any) {
    toast.add({
      title: err?.message || 'Gagal memuat konfigurasi',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const updateData = async (event: any) => {
  loading.value = true

  try {
    // 1. Handle Upload Banner jika ada file baru dipilih
    if (bannerFile.value) {
      const uploadedUrl = await fileUpload(bannerFile.value)
      if (uploadedUrl) {
        form.hero_banner = uploadedUrl
      }
    }

    const currentData = form // Gunakan data form terbaru setelah upload
    const original = initialForm.value ? JSON.parse(initialForm.value) : {}

    const changedEntries = Object.entries(currentData).filter(
      ([key, value]) => {
        const oldValue = original[key]
        const normalizedNew = value || ''
        const normalizedOld = oldValue || ''
        return JSON.stringify(normalizedNew) !== JSON.stringify(normalizedOld)
      }
    )

    if (changedEntries.length === 0 && !bannerFile.value) {
      toast.add({ title: 'Tidak ada perubahan', color: 'neutral' })
      loading.value = false
      return
    }

    const requests = changedEntries.map(([key, value]) => {
      const payloadValue = Array.isArray(value) ? JSON.stringify(value) : value
      return useApi(`/environment/${key}`, {
        method: 'POST',
        body: { value: payloadValue }
      })
    })

    await Promise.all(requests)

    toast.add({ title: 'Konfigurasi berhasil diperbarui', color: 'success' })
    bannerFile.value = null // Reset file input
    await getData()
  } catch (err: any) {
    toast.add({
      title: err?.message || 'Gagal memperbarui data',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

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
          Kelola informasi landing page dan aplikasi.
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
        <template #header
          ><span class="font-bold text-primary-600"
            >Landing Page & Mobile App</span
          ></template
        >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UFormField
            name="hero_banner"
            label="Hero Banner Image"
            help="Upload gambar untuk banner utama halaman depan"
          >
            <UFileUpload
              v-model="bannerFile"
              accept="image/*"
              icon="i-lucide-image-plus"
              label="Pilih Foto Banner"
            />
          </UFormField>

          <div class="space-y-4">
            <UFormField name="link_googleplay" label="Link Google Play Store">
              <UInput
                v-model="form.link_googleplay"
                icon="i-simple-icons-googleplay"
                placeholder="https://play.google.com/..."
              />
            </UFormField>
          </div>
        </div>
      </UCard>

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
