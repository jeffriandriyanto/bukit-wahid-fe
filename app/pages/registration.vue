<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { genderItems } from '~/const/dropdown'
const { dropdownRT, getDropdownRT } = useApiDropdown()
const isSuccessModalOpen = ref(false)
const router = useRouter()

// --- VALIDATION SCHEMA ---
const schema = z.object({
  no_kk: z.string().optional(),
  rt_id: z.any().refine((val) => !!val, 'RT wajib dipilih'),
  address_id: z.any().refine((val) => !!val, 'Alamat rumah wajib dipilih'),
  head: z.object({
    name: z.string().min(1, 'Nama lengkap kepala keluarga wajib diisi'),
    phone: z.string().min(10, 'Nomor WhatsApp minimal 10 digit'),
    gender: z.string().optional().or(z.literal('')),
    bod: z.string().optional().or(z.literal('')),
    pob: z.string().optional().or(z.literal('')),
    nik: z
      .string()
      .length(16, 'NIK harus 16 digit')
      .optional()
      .or(z.literal(''))
  }),

  spouse: z.object({
    name: z.string().min(1, 'Nama lengkap pasangan wajib diisi'),
    phone: z.string().optional().or(z.literal('')),
    gender: z.string().min(1, 'Pilih jenis kelamin'),
    bod: z.string().optional().or(z.literal('')),
    pob: z.string().optional().or(z.literal('')),
    nik: z.string().optional().or(z.literal(''))
  }),

  childs: z.array(
    z.object({
      name: z.string().min(1, 'Nama anak wajib diisi'),
      phone: z.string().optional().or(z.literal('')),
      gender: z.string().min(1, 'Pilih jenis kelamin'),
      bod: z.string().optional(),
      pob: z.string().optional().or(z.literal('')),
      nik: z.string().optional().or(z.literal(''))
    })
  )
})

type Schema = z.output<typeof schema>

// --- STATE ---
const loading = ref(false)
const addressOptions = ref([])

const state = reactive({
  no_kk: '',
  rt_id: '',
  address_id: '',
  head: {
    name: '',
    phone: '',
    gender: 'L',
    bod: '',
    pob: '',
    nik: ''
  },
  spouse: {
    name: '',
    phone: '',
    gender: 'P',
    bod: '',
    pob: '',
    nik: ''
  },
  childs: [] as any[]
})

const getAddress = async (rtId: string) => {
  if (!rtId) return
  try {
    const res = await useApi<any>(`/dropdown/address/${rtId}`)
    if (res.status === 1) {
      addressOptions.value = res.data.map((i: any) => ({
        key: i.key,
        label: i.label
      }))
    }
  } catch (err) {
    console.error('Failed to fetch Address:', err)
  }
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  loading.value = true
  try {
    const payload = JSON.parse(JSON.stringify(event.data))
    // Hapus rt_id karena API hanya butuh address_id
    delete payload.rt_id

    const res = await useApi<any>('/familly/registration', {
      method: 'POST',
      body: payload
    })

    if (res.status === 1) {
      isSuccessModalOpen.value = true
      resetForm()
    }
  } catch (err: any) {
    // Tampilkan pesan error dari API jika ada, atau fallback ke pesan default
    alert(
      err.data?.message ||
        'Terjadi kesalahan saat mengirim data. Silakan coba lagi.'
    )
  } finally {
    loading.value = false
  }
}

const handleFinish = () => {
  isSuccessModalOpen.value = false
  router.push('/') // Lari ke landing page
}

// --- HELPERS ---
const resetForm = () => {
  Object.assign(state, {
    no_kk: '',
    rt_id: null,
    address_id: null,
    head: {
      name: '',
      phone: '',
      gender: 'L',
      bod: '',
      pob: '',
      nik: ''
    },
    spouse: {
      name: '',
      phone: '',
      gender: 'P',
      bod: '',
      pob: '',
      nik: ''
    },
    childs: []
  })
}

const addChild = () => {
  state.childs.push({
    name: '',
    phone: '',
    gender: 'L',
    bod: '',
    pob: '',
    nik: ''
  })
}

const removeChild = (index: number) => {
  state.childs.splice(index, 1)
}

watch(
  () => state.rt_id,
  (newRt) => {
    state.address_id = ''
    addressOptions.value = []
    if (newRt) getAddress(newRt)
  }
)

definePageMeta({
  layout: 'white'
})

onMounted(() => {
  isSuccessModalOpen.value = true
  getDropdownRT()
})
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-12 px-4 sm:px-6 lg:px-8 font-sans"
  >
    <div class="w-full max-w-5xl">
      <div class="mb-12 text-center">
        <div
          class="inline-flex items-center justify-center p-4 bg-primary-600 rounded-3xl shadow-xl shadow-primary-200 mb-6"
        >
          <UIcon name="i-lucide-users-round" class="w-12 h-12 text-white" />
        </div>
        <h1
          class="text-4xl font-black text-slate-900 tracking-tight sm:text-5xl"
        >
          Formulir Warga Baru
        </h1>
        <p class="text-slate-500 mt-3 text-lg font-medium">
          Lengkapi data keluarga untuk pendataan digital lingkungan.
        </p>
      </div>

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-10"
        @submit="onSubmit"
      >
        <section
          class="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden"
        >
          <div
            class="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 opacity-50"
          />

          <div class="flex items-center gap-4 mb-8">
            <div
              class="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-xl font-black"
            >
              1
            </div>
            <div>
              <h2 class="text-2xl font-bold text-slate-800">Domisili & KK</h2>
              <p class="text-sm text-slate-400">
                Identitas utama tempat tinggal
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
            <UFormField
              label="Nomor Kartu Keluarga"
              name="no_kk"
              class="md:col-span-4"
            >
              <UInput
                v-model="state.no_kk"
                icon="i-heroicons-identification"
                size="xl"
                placeholder="Contoh: 3374012345678901"
              />
            </UFormField>

            <UFormField
              label="Wilayah RT"
              name="rt_id"
              class="md:col-span-3"
              required
            >
              <USelectMenu
                v-model="state.rt_id"
                :items="dropdownRT"
                value-key="key"
                label-key="label"
                placeholder="Pilih RT..."
                size="xl"
              />
            </UFormField>

            <UFormField
              label="Alamat / Nomor Rumah"
              name="address_id"
              class="md:col-span-5"
              required
            >
              <USelectMenu
                v-model="state.address_id"
                :items="addressOptions"
                value-key="key"
                label-key="label"
                placeholder="Cari nomor rumah..."
                size="xl"
                :disabled="!state.rt_id"
              />
            </UFormField>
          </div>
        </section>

        <section
          class="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
          <div class="flex items-center gap-4 mb-8">
            <div
              class="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-black"
            >
              2
            </div>
            <div>
              <h2 class="text-2xl font-bold text-slate-800">Kepala Keluarga</h2>
              <p class="text-sm text-slate-400">
                Data penanggung jawab keluarga
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <UFormField
              label="Nama Lengkap (Tanpa Gelar)"
              name="head.name"
              required
            >
              <UInput
                v-model="state.head.name"
                size="lg"
                placeholder="Masukkan nama sesuai KTP"
              />
            </UFormField>
            <UFormField label="Nomor WhatsApp Aktif" name="head.phone" required>
              <UInput
                v-model="state.head.phone"
                size="lg"
                placeholder="Contoh: 08123456789"
                icon="i-lucide-phone"
              />
            </UFormField>

            <UFormField label="NIK Kepala Keluarga" name="head.nik">
              <UInput
                v-model="state.head.nik"
                size="lg"
                placeholder="16 Digit NIK"
              />
            </UFormField>

            <UFormField label="Jenis Kelamin" name="head.gender">
              <USelectMenu
                v-model="state.head.gender"
                :items="genderItems"
                value-key="key"
                label-key="label"
                size="lg"
              />
            </UFormField>
            <UFormField label="Tempat Lahir" name="head.pob">
              <UInput
                v-model="state.head.pob"
                size="lg"
                placeholder="Contoh: Semarang"
              />
            </UFormField>
            <UFormField label="Tanggal Lahir" name="head.bod">
              <UInput v-model="state.head.bod" type="date" size="lg" />
            </UFormField>
          </div>
        </section>

        <section
          class="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
          <div class="flex items-center gap-4 mb-8">
            <div
              class="w-12 h-12 rounded-2xl bg-pink-600 flex items-center justify-center text-white text-xl font-black"
            >
              3
            </div>
            <div>
              <h2 class="text-2xl font-bold text-slate-800">Istri / Suami</h2>
              <p class="text-sm text-slate-400">Data pasangan (jika ada)</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <UFormField
              label="Nama Lengkap Pasangan"
              name="spouse.name"
              required
            >
              <UInput
                v-model="state.spouse.name"
                size="lg"
                placeholder="Nama sesuai KTP"
              />
            </UFormField>
            <UFormField label="NIK Pasangan" name="spouse.nik">
              <UInput
                v-model="state.spouse.nik"
                size="lg"
                placeholder="16 Digit NIK"
              />
            </UFormField>
            <UFormField label="Nomor WhatsApp (Opsional)" name="spouse.phone">
              <UInput
                v-model="state.spouse.phone"
                size="lg"
                placeholder="08xxxx"
              />
            </UFormField>
            <UFormField label="Jenis Kelamin" name="spouse.gender">
              <USelectMenu
                v-model="state.spouse.gender"
                :items="genderItems"
                value-key="key"
                label-key="label"
                size="lg"
              />
            </UFormField>
            <UFormField label="Tempat Lahir" name="spouse.pob">
              <UInput
                v-model="state.spouse.pob"
                size="lg"
                placeholder="Kota Kelahiran"
              />
            </UFormField>
            <UFormField label="Tanggal Lahir" name="spouse.bod">
              <UInput v-model="state.spouse.bod" type="date" size="lg" />
            </UFormField>
          </div>
        </section>

        <section
          class="bg-slate-100/60 rounded-[2.5rem] p-6 border-2 border-dashed border-slate-200"
        >
          <div class="flex flex-wrap sm:justify-between items-center mb-8">
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-xl font-black"
              >
                4
              </div>
              <div>
                <h2 class="text-2xl font-bold text-slate-800">Data Anak</h2>
                <p class="text-sm text-slate-500">
                  Tambahkan anak sesuai Kartu Keluarga
                </p>
              </div>
            </div>
            <UButton
              icon="i-heroicons-plus-circle"
              color="primary"
              variant="solid"
              label="Tambah Anak"
              class="rounded-2xl px-6 py-2.5 font-bold shadow-lg shadow-primary-400 mt-2 sm:mt-0"
              @click="addChild"
            />
          </div>

          <div
            v-if="state.childs.length === 0"
            class="text-center py-16 bg-white rounded-4xl border border-slate-100 shadow-inner"
          >
            <div
              class="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <UIcon name="i-lucide-baby" class="w-10 h-10 text-slate-300" />
            </div>
            <p class="text-slate-400 font-medium">
              Belum ada data anak yang ditambahkan.
            </p>
            <p class="text-xs text-slate-300 mt-1">
              Silakan klik tombol "Tambah Anak" di atas jika ada.
            </p>
          </div>

          <div class="space-y-8">
            <div
              v-for="(child, index) in state.childs"
              :key="index"
              class="bg-white p-6 rounded-4xl shadow-sm border border-slate-100 relative group animate-in slide-in-from-top-4 duration-300"
            >
              <div
                class="absolute -top-3 left-8 px-5 py-1.5 bg-orange-600 text-white text-xs font-black uppercase rounded-full tracking-widest shadow-lg shadow-orange-100"
              >
                Anak Ke-{{ index + 1 }}
              </div>

              <UButton
                icon="i-heroicons-trash"
                color="red"
                variant="soft"
                size="sm"
                class="absolute top-6 right-6 rounded-xl hover:bg-red-100 transition-colors"
                @click="removeChild(index)"
              />

              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-4">
                <UFormField
                  label="Nama Lengkap Anak"
                  :name="`childs.${index}.name`"
                >
                  <UInput
                    v-model="child.name"
                    placeholder="Sesuai Akta Kelahiran / KK"
                    size="lg"
                  />
                </UFormField>
                <UFormField
                  label="NIK Anak (Jika Ada)"
                  :name="`childs.${index}.nik`"
                >
                  <UInput
                    v-model="child.nik"
                    placeholder="NIK atau nomor KIA"
                    size="lg"
                  />
                </UFormField>
                <UFormField
                  label="Jenis Kelamin"
                  :name="`childs.${index}.gender`"
                >
                  <USelectMenu
                    v-model="child.gender"
                    :items="genderItems"
                    value-key="key"
                    label-key="label"
                    size="lg"
                  />
                </UFormField>
                <UFormField label="Tanggal Lahir" :name="`childs.${index}.bod`">
                  <UInput v-model="child.bod" type="date" size="lg" />
                </UFormField>
              </div>
            </div>
          </div>
        </section>

        <div class="pt-8 text-center max-w-2xl mx-auto">
          <UButton
            type="submit"
            size="xl"
            block
            :loading="loading"
            class="rounded-4xl py-8 font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary-200 transition-all hover:scale-[1.02] active:scale-95 bg-primary-600 hover:bg-primary-700"
          >
            Kirim Data Keluarga
          </UButton>
          <div
            class="mt-8 flex items-center justify-center gap-3 text-slate-400"
          >
            <UIcon
              name="i-heroicons-shield-check"
              class="w-6 h-6 text-green-500"
            />
            <span class="text-sm font-medium italic"
              >Data pendaftaran ini bersifat rahasia dan akan diverifikasi oleh
              pengurus RT setempat.</span
            >
          </div>
        </div>
      </UForm>
    </div>

    <UModal
      v-model:openl="isSuccessModalOpen"
      prevent-close
      :ui="{ body: 'sm:max-w-md' }"
    >
      <template #body>
        <div class="p-8 text-center">
          <div
            class="mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-bounce"
          >
            <UIcon
              name="i-heroicons-check-circle"
              class="w-16 h-16 text-green-500"
            />
          </div>

          <h3 class="text-2xl font-black text-slate-900 mb-4">
            Registrasi Berhasil!
          </h3>

          <div class="space-y-4 mb-8 text-slate-600 leading-relaxed text-sm">
            <p>
              Data keluarga Anda telah kami terima dengan aman dalam sistem.
            </p>
            <div
              class="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-blue-700 text-xs italic"
            >
              <div class="flex gap-2 items-start text-left">
                <UIcon name="i-lucide-info" class="w-5 h-5 shrink-0" />
                <span>
                  <strong>Penting:</strong> Username & Password akan dikirim
                  secara otomatis melalui <strong>WhatsApp</strong> ke nomor
                  Kepala Keluarga.
                </span>
              </div>
            </div>
          </div>

          <UButton
            label="Selesai & Kembali ke Beranda"
            block
            size="xl"
            color="primary"
            class="rounded-2xl py-4 font-bold shadow-lg shadow-primary-100"
            @click="handleFinish"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
