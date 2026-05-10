<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { genderItems, religionOptions } from '~/const/dropdown'

const {
  dropdownRT,
  dropdownResidenceCategory,
  getDropdownRT,
  getDropdownResidenceCategory
} = useApiDropdown()

const { reveal: confirm } = useConfirmService()

const router = useRouter()

const loading = ref(false)

const addressOptions = ref([])

// =========================
// HELPERS
// =========================

const requiredText = (message: string) => z.string().min(1, message)

const optionalText = z.string().nullable()

// =========================
// SCHEMA
// =========================

const residentSchema = z.object({
  name: requiredText('Nama wajib diisi'),
  phone: optionalText,
  gender: requiredText('Gender wajib diisi'),
  dob: requiredText('Tanggal lahir wajib diisi'),
  pob: requiredText('Tempat lahir wajib diisi'),
  nik: optionalText,
  religion: requiredText('Agama wajib diisi'),
  avatar: optionalText,
  blood_type: optionalText,
  email: optionalText,
  job: optionalText,
  nationality: optionalText,
  last_education: optionalText
})

const headSchema = z.object({
  name: requiredText('Nama wajib diisi'),
  phone: requiredText('No HP wajib diisi'),
  gender: requiredText('Gender wajib diisi'),
  dob: requiredText('Tanggal lahir wajib diisi'),
  pob: requiredText('Tempat lahir wajib diisi'),
  nik: optionalText,
  religion: requiredText('Agama wajib diisi'),
  avatar: optionalText,
  blood_type: optionalText,
  email: optionalText,
  job: optionalText,
  nationality: optionalText,
  last_education: optionalText
})

const schema = z.object({
  rt_id: requiredText('RT wajib dipilih'),
  address: requiredText('Alamat wajib dipilih'),
  category: requiredText('Kategori tinggal wajib dipilih'),
  head: headSchema,
  spouse: residentSchema.nullable(),
  childs: z.array(residentSchema),
  other: z.array(residentSchema)
})

type Schema = z.output<typeof schema>

// =========================
// FACTORY
// =========================

const createResident = () => ({
  name: '',
  phone: null,
  gender: '',
  dob: '',
  pob: '',
  nik: null,
  religion: '',
  avatar: null,
  blood_type: null,
  email: null,
  job: null,
  nationality: null,
  last_education: null
})

// =========================
// STATE
// =========================

const state = reactive({
  rt_id: '',
  address: '',
  category: 'Tetap',
  head: {
    ...createResident(),
    phone: '',
    gender: 'L'
  },
  spouse: null as any,
  childs: [] as any[],
  other: [] as any[]
})

// =========================
// API
// =========================

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

    delete payload.rt_id

    const res = await useApi<any>('/familly/registration', {
      method: 'POST',
      body: payload
    })

    if (res.status === 1) {
      const ok = await confirm({
        title: 'Registrasi Berhasil!',
        description:
          'Data pendaftaran Anda telah diterima dan akan divalidasi oleh Admin.',
        confirmLabel: 'Selesai',
        color: 'primary'
      })

      if (ok) {
        resetForm()
        router.push('/')
      }
    }
  } catch (err: any) {
    alert(err.data?.message || 'Terjadi kesalahan sistem.')
  } finally {
    loading.value = false
  }
}

// =========================
// HELPERS
// =========================
const enableSpouse = () => {
  state.spouse = {
    ...createResident(),
    gender: 'P'
  }
}

const removeSpouse = () => {
  state.spouse = null
}

const resetForm = () => {
  Object.assign(state, {
    rt_id: '',
    address: '',
    category: 'Tetap',
    head: {
      ...createResident(),
      phone: '',
      gender: 'L'
    },
    spouse: null,
    childs: [],
    other: []
  })
}

const addMember = (type: 'childs' | 'other') => {
  state[type].push({
    ...createResident(),
    gender: 'L'
  })
}

const removeMember = (type: 'childs' | 'other', index: number) => {
  state[type].splice(index, 1)
}

// =========================
// WATCH
// =========================

watch(
  () => state.rt_id,
  (newRt) => {
    state.address = ''
    addressOptions.value = []

    if (newRt) {
      getAddress(newRt)
    }
  }
)

definePageMeta({
  layout: 'white'
})

onMounted(() => {
  getDropdownRT()
  getDropdownResidenceCategory()
})
</script>

<template>
  <!-- Background Decor -->
  <div>
    <div class="fixed inset-0 -z-10 overflow-hidden bg-slate-50">
      <div
        class="absolute -top-[10%] -left-[10%] w-[70%] h-[40%] rounded-full bg-primary-100/50 blur-[120px]"
      />
      <div
        class="absolute top-[40%] -right-[10%] w-[60%] h-[40%] rounded-full bg-blue-100/50 blur-[120px]"
      />
    </div>

    <div class="min-h-screen font-sans pb-24">
      <ConfirmDialog />

      <!-- Mobile Wrapper -->
      <div
        class="w-full max-w-120 mx-auto min-h-screen bg-white/40 backdrop-blur-md shadow-2xl shadow-slate-200/50"
      >
        <!-- Sticky Header ala Tokopedia -->
        <header
          class="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 p-5 flex items-center gap-4"
        >
          <UButton
            icon="i-heroicons-chevron-left"
            variant="ghost"
            color="neutral"
            @click="router.back()"
          />
          <h1 class="text-xl font-bold text-slate-800">Registrasi Warga</h1>
        </header>

        <div class="p-5">
          <div class="mb-8">
            <p class="text-slate-500 text-sm">
              Selamat datang! Mohon lengkapi data kependudukan Anda untuk
              pendataan wilayah.
            </p>
          </div>

          <UForm
            :schema="schema"
            :state="state"
            class="space-y-6"
            @submit="onSubmit"
          >
            <!-- SECTION 1: DOMISILI -->
            <div
              class="bg-white rounded-4xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md"
            >
              <div class="flex items-center gap-3 mb-6">
                <span class="p-2 bg-primary-50 rounded-lg text-primary-600">
                  <UIcon name="i-heroicons-home-modern" class="w-5 h-5" />
                </span>
                <h2
                  class="font-bold text-slate-800 uppercase tracking-wider text-xs"
                >
                  Lokasi Domisili
                </h2>
              </div>
              <div class="space-y-4">
                <UFormField label="Wilayah RT" name="rt_id" required>
                  <USelectMenu
                    v-model="state.rt_id"
                    :items="dropdownRT"
                    value-key="key"
                    label-key="label"
                    placeholder="Pilih RT"
                    size="xl"
                  />
                </UFormField>

                <UFormField label="Alamat / No. Rumah" name="address" required>
                  <USelectMenu
                    v-model="state.address"
                    :items="addressOptions"
                    value-key="key"
                    label-key="label"
                    placeholder="Cari Alamat"
                    size="xl"
                    :disabled="!state.rt_id"
                    :ui="{ base: 'rounded-2xl' }"
                  />
                </UFormField>

                <UFormField label="Kategori Tinggal" name="category" required>
                  <USelectMenu
                    v-model="state.category"
                    :items="dropdownResidenceCategory"
                    value-key="key"
                    label-key="label"
                    placeholder="Pilih kategori tinggal"
                    size="xl"
                  />
                </UFormField>
              </div>
            </div>

            <!-- SECTION 2: KEPALA KELUARGA -->
            <div
              class="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100"
            >
              <div class="flex items-center gap-3 mb-6">
                <span class="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <UIcon name="i-heroicons-user-circle" class="w-5 h-5" />
                </span>
                <h2
                  class="font-bold text-slate-800 uppercase tracking-wider text-xs"
                >
                  Kepala Keluarga
                </h2>
              </div>
              <div class="space-y-4">
                <UFormField label="Nama Lengkap" name="head.name" required>
                  <UInput
                    v-model="state.head.name"
                    size="xl"
                    placeholder="Sesuai KTP"
                    :ui="{ base: 'rounded-2xl' }"
                    class="bg-slate-50 rounded-2xl"
                  />
                </UFormField>
                <UFormField label="Nomor WhatsApp" name="head.phone" required>
                  <UInput
                    v-model="state.head.phone"
                    size="xl"
                    placeholder="0812..."
                    :ui="{ base: 'rounded-2xl' }"
                    class="bg-slate-50 rounded-2xl"
                  />
                </UFormField>
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Tempat Lahir" name="head.pob" required>
                    <UInput
                      v-model="state.head.pob"
                      size="xl"
                      :ui="{ base: 'rounded-2xl' }"
                    />
                  </UFormField>
                  <UFormField label="Tgl Lahir" name="head.dob" required>
                    <UInput
                      v-model="state.head.dob"
                      type="date"
                      size="xl"
                      :ui="{ base: 'rounded-2xl' }"
                    />
                  </UFormField>

                  <UFormField label="Jenis Kelamin" name="head.gender" required>
                    <USelectMenu
                      v-model="state.head.gender"
                      :items="genderItems"
                      value-key="key"
                      label-key="label"
                      size="xl"
                      :ui="{ base: 'rounded-2xl' }"
                    />
                  </UFormField>

                  <UFormField label="Agama" name="head.religion" required>
                    <USelectMenu
                      v-model="state.head.religion"
                      :items="religionOptions"
                      value-key="key"
                      label-key="label"
                      size="xl"
                      class="w-full"
                    />
                  </UFormField>
                </div>
              </div>
            </div>

            <!-- SECTION 3: KELUARGA (ISTRI & ANAK) -->
            <div
              class="bg-white rounded-4xl p-6 shadow-sm border border-slate-100"
            >
              <div class="flex items-center gap-3 mb-6">
                <span class="p-2 bg-pink-50 rounded-lg text-pink-600">
                  <UIcon name="i-heroicons-users" class="w-5 h-5" />
                </span>
                <h2
                  class="font-bold text-slate-800 uppercase tracking-wider text-xs"
                >
                  Anggota Keluarga
                </h2>
              </div>

              <!-- Istri -->
              <div class="pb-6 border-b border-slate-50 mb-6">
                <div class="flex items-center justify-between mb-4">
                  <p class="text-xs font-semibold text-slate-400 italic">
                    Pasangan (Istri/Suami)
                  </p>

                  <UButton
                    v-if="!state.spouse"
                    label="Tambah Pasangan"
                    icon="i-heroicons-plus-circle"
                    size="xs"
                    variant="soft"
                    @click="enableSpouse"
                  />

                  <UButton
                    v-else
                    label="Hapus"
                    icon="i-heroicons-trash"
                    size="xs"
                    color="error"
                    variant="soft"
                    @click="removeSpouse"
                  />
                </div>

                <div v-if="state.spouse" class="space-y-4">
                  <UFormField label="Nama Pasangan" name="spouse.name" required>
                    <UInput
                      v-model="state.spouse.name"
                      size="xl"
                      :ui="{ base: 'rounded-2xl' }"
                    />
                  </UFormField>

                  <div class="grid grid-cols-2 gap-4">
                    <UFormField
                      label="Jenis Kelamin"
                      name="spouse.gender"
                      required
                    >
                      <USelectMenu
                        v-model="state.spouse.gender"
                        :items="genderItems"
                        value-key="key"
                        label-key="label"
                        size="xl"
                        :ui="{ base: 'rounded-2xl' }"
                      />
                    </UFormField>

                    <UFormField label="Agama" name="spouse.religion" required>
                      <USelectMenu
                        v-model="state.spouse.religion"
                        :items="religionOptions"
                        placeholder="Agama"
                        value-key="key"
                        label-key="label"
                        size="xl"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <UFormField label="Tempat Lahir" name="spouse.pob" required>
                      <UInput
                        v-model="state.spouse.pob"
                        size="xl"
                        placeholder="Tempat Lahir"
                        :ui="{ base: 'rounded-2xl' }"
                      />
                    </UFormField>

                    <UFormField
                      label="Tanggal Lahir"
                      name="spouse.dob"
                      required
                    >
                      <UInput
                        v-model="state.spouse.dob"
                        type="date"
                        size="xl"
                        :ui="{ base: 'rounded-2xl' }"
                      />
                    </UFormField>
                  </div>
                </div>

                <div
                  v-else
                  class="border border-dashed border-slate-200 rounded-2xl py-6 text-center"
                >
                  <p class="text-xs text-slate-400 italic">
                    Belum menambahkan pasangan
                  </p>
                </div>
              </div>

              <!-- Anak List -->
              <div>
                <div class="flex justify-between items-center mb-4">
                  <p class="text-xs font-semibold text-slate-400 italic">
                    Data Anak
                  </p>
                  <UButton
                    label="Tambah"
                    icon="i-heroicons-plus-circle"
                    variant="soft"
                    size="xs"
                    @click="addMember('childs')"
                  />
                </div>

                <div class="space-y-4">
                  <div
                    v-for="(child, index) in state.childs"
                    :key="index"
                    class="p-4 bg-slate-50 rounded-2xl relative group"
                  >
                    <UButton
                      icon="i-heroicons-x-mark"
                      color="primary"
                      variant="ghost"
                      size="xs"
                      class="absolute -top-2 -right-2 bg-white shadow-sm rounded-full"
                      @click="removeMember('childs', index)"
                    />
                    <div class="grid grid-cols-1 gap-3">
                      <UFormField :name="`childs.${index}.name`" required>
                        <UInput
                          v-model="child.name"
                          placeholder="Nama Anak"
                          size="lg"
                          :ui="{ base: 'rounded-xl' }"
                        />
                      </UFormField>

                      <UFormField :name="`childs.${index}.gender`" required>
                        <USelectMenu
                          v-model="child.gender"
                          :items="genderItems"
                          value-key="key"
                          label-key="label"
                          size="lg"
                          :ui="{ base: 'rounded-xl' }"
                        />
                      </UFormField>

                      <div class="grid grid-cols-2 gap-3">
                        <UFormField :name="`childs.${index}.pob`" required>
                          <UInput
                            v-model="child.pob"
                            placeholder="Tempat Lahir"
                            size="lg"
                            :ui="{ base: 'rounded-xl' }"
                          />
                        </UFormField>

                        <UFormField :name="`childs.${index}.dob`" required>
                          <UInput
                            v-model="child.dob"
                            type="date"
                            size="lg"
                            :ui="{ base: 'rounded-xl' }"
                          />
                        </UFormField>
                      </div>

                      <UFormField :name="`childs.${index}.religion`" required>
                        <USelectMenu
                          v-model="child.religion"
                          :items="religionOptions"
                          placeholder="Agama"
                          value-key="key"
                          label-key="label"
                          size="xl"
                          class="w-full"
                        />
                      </UFormField>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="bg-white rounded-4xl p-6 shadow-sm border border-slate-100 transition-all"
            >
              <div class="flex items-center gap-3 mb-6">
                <span class="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <UIcon name="i-heroicons-user-group" class="w-5 h-5" />
                </span>
                <h2
                  class="font-bold text-slate-800 uppercase tracking-wider text-xs"
                >
                  Anggota Lain (ART / Lainnya)
                </h2>
              </div>

              <div class="flex justify-between items-center mb-4">
                <div class="flex flex-col">
                  <p class="text-xs font-semibold text-slate-400 italic">
                    Data Anggota
                  </p>
                  <span class="text-[10px] text-slate-400 leading-tight"
                    >Gunakan jika ada ART atau saudara yang tinggal
                    menetap</span
                  >
                </div>
                <UButton
                  label="Tambah"
                  icon="i-heroicons-plus-circle"
                  variant="soft"
                  size="xs"
                  color="info"
                  @click="addMember('other')"
                />
              </div>

              <div class="space-y-4">
                <div
                  v-for="(item, index) in state.other"
                  :key="index"
                  class="p-4 bg-slate-50/50 rounded-2xl relative border border-dashed border-slate-200"
                >
                  <!-- Remove Button -->
                  <UButton
                    icon="i-heroicons-x-mark"
                    color="primary"
                    variant="ghost"
                    size="xs"
                    class="absolute -top-2 -right-2 bg-white shadow-sm rounded-full"
                    @click="removeMember('other', index)"
                  />

                  <div class="grid grid-cols-2 gap-3">
                    <UFormField :name="`other.${index}.name`" required>
                      <UInput
                        v-model="item.name"
                        placeholder="Nama Lengkap"
                        size="lg"
                        :ui="{ base: 'rounded-xl' }"
                        class="bg-white"
                      />
                    </UFormField>

                    <UFormField :name="`other.${index}.gender`" required>
                      <USelectMenu
                        v-model="item.gender"
                        :items="genderItems"
                        value-key="key"
                        label-key="label"
                        placeholder="Jenis Kelamin"
                        size="lg"
                        :ui="{ base: 'rounded-xl' }"
                        class="bg-white"
                      />
                    </UFormField>

                    <UFormField :name="`other.${index}.religion`" required>
                      <USelectMenu
                        v-model="item.religion"
                        :items="religionOptions"
                        value-key="key"
                        label-key="label"
                        size="xl"
                        placeholder="Agama"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField :name="`other.${index}.pob`" required>
                      <UInput
                        v-model="item.pob"
                        placeholder="Tempat Lahir"
                        size="lg"
                        :ui="{ base: 'rounded-xl' }"
                      />
                    </UFormField>

                    <UFormField :name="`other.${index}.dob`" required>
                      <UInput
                        v-model="item.dob"
                        type="date"
                        size="lg"
                        :ui="{ base: 'rounded-xl' }"
                      />
                    </UFormField>
                  </div>
                </div>

                <!-- Empty State Simple -->
                <div
                  v-if="state.other.length === 0"
                  class="py-8 text-center border-2 border-dashed border-slate-50 rounded-2xl"
                >
                  <p class="text-xs text-slate-400 italic">
                    Belum ada anggota tambahan
                  </p>
                </div>
              </div>
            </div>

            <!-- Bottom Action Container -->
            <div
              class="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-xl border-t border-slate-100 sm:relative sm:bg-transparent sm:border-0 sm:p-0"
            >
              <div class="max-w-120 mx-auto">
                <UButton
                  type="submit"
                  size="xl"
                  block
                  :loading="loading"
                  class="rounded-2xl py-4 font-bold text-md shadow-lg shadow-primary-200 transition-transform active:scale-95 bg-primary-600 hover:bg-primary-700"
                >
                  Kirim Data Sekarang
                </UButton>
              </div>
            </div>
          </UForm>
        </div>
      </div>
    </div>
  </div>
</template>
