<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { perPageLimit } from '~/const/utils'
import { genderItems, religionOptions } from '~/const/dropdown'

const {
  dropdownRT,
  dropdownAddress,
  dropdownResidenceCategory,
  getDropdownRT,
  getDropdownAddress,
  getDropdownResidenceCategory
} = useApiDropdown()

// =========================
// ZOD HELPERS
// =========================

const requiredText = (message: string) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.string().min(1, message)
  )

const optionalText = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.string().nullable()
)

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

const stepAddressSchema = z.object({
  rt: z.string().min(1, 'RT wajib dipilih'),
  address: z.string().min(1, 'Alamat wajib dipilih'),
  category: z.string().min(1, 'Kategori wajib dipilih')
})

const stepHeadSchema = z.object({
  head: headSchema
})

const stepSpouseSchema = z.object({
  spouse: residentSchema.nullable()
})

const stepFamilySchema = z.object({
  childs: z.array(residentSchema),
  others: z.array(residentSchema)
})

const FamilyCardFormSchema = z.object({
  rt: z.string().min(1, 'RT wajib dipilih'),
  address: z.string().min(1, 'Alamat wajib dipilih'),
  category: z.string().min(1, 'Kategori wajib dipilih'),

  head: headSchema,
  spouse: residentSchema.nullable(),
  childs: z.array(residentSchema),
  others: z.array(residentSchema)
})

type FamilyCardFormSchema = z.infer<typeof FamilyCardFormSchema>

type ResidentForm = z.infer<typeof residentSchema>
type HeadForm = z.infer<typeof headSchema>

// =========================
// STATE
// =========================

const { reveal: confirm } = useConfirmService()
const toast = useToast()

const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingId = ref<string | null>(null)

const loading = ref(false)
const loadingEdit = ref(false)
const loadingToggle = ref(false)

const selectedRT = ref()
const currentStep = ref(0)

const dataFamilyCard = ref<any[]>([])
const completedSteps = ref<number[]>([])

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0
})

const createResident = (): ResidentForm => ({
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

const createHead = (): HeadForm => ({
  name: '',
  phone: '',
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

const form = reactive<FamilyCardFormSchema>({
  rt: '',
  address: '',
  category: '',

  head: createHead(),
  spouse: null,
  childs: [],
  others: []
})

// =========================
// TABLE
// =========================

const columnsFamilyTable = [
  { accessorKey: 'head', header: 'Kepala Keluarga' },
  { accessorKey: 'total', header: 'Total Anggota' },
  { id: 'status', header: 'Status' },
  { accessorKey: 'spouse', header: 'Pasangan' },
  { id: 'action', header: 'Aksi' }
]

// =========================
// STEPPER
// =========================

const stepItems = computed(() => [
  {
    title: 'Alamat',
    icon: completedSteps.value.includes(0)
      ? 'i-lucide-circle-check-big'
      : 'i-lucide-map-pinned'
  },
  {
    title: 'Kepala Keluarga',
    icon: completedSteps.value.includes(1)
      ? 'i-lucide-circle-check-big'
      : 'i-lucide-user-round'
  },
  {
    title: 'Pasangan',
    icon: completedSteps.value.includes(2)
      ? 'i-lucide-circle-check-big'
      : 'i-lucide-heart-handshake'
  },
  {
    title: 'Anak & Lainnya',
    icon: completedSteps.value.includes(3)
      ? 'i-lucide-circle-check-big'
      : 'i-lucide-users'
  },
  {
    title: 'Review',
    icon: 'i-lucide-clipboard-list'
  }
])

// =========================
// HELPERS
// =========================

const resetForm = () => {
  Object.assign(form, {
    rt: '',
    address: '',
    category: '',
    head: createHead(),
    spouse: null,
    childs: [],
    others: []
  })

  currentStep.value = 0
  editingId.value = null
  completedSteps.value = []
}

const addChild = () => {
  form.childs.push(createResident())
}

const removeChild = (index: number) => {
  form.childs.splice(index, 1)
}

const addOthers = () => {
  form.others.push(createResident())
}

const removeOthers = (index: number) => {
  form.others.splice(index, 1)
}

const enableSpouse = () => {
  form.spouse = createResident()
}

const removeSpouse = () => {
  form.spouse = null
}

const addressHandler = () => {
  form.address = ''
  getDropdownAddress(form.rt)
}

const pushCompletedStep = (stepIndex: number) => {
  if (!completedSteps.value.includes(stepIndex)) {
    completedSteps.value.push(stepIndex)
  }
}

const showValidationError = (message: string) => {
  toast.add({
    title: message || 'Lengkapi data terlebih dahulu',
    color: 'error'
  })
}

const validateStep = (stepIndex: number) => {
  let result: z.SafeParseReturnType<any, any> | undefined

  if (stepIndex === 0) {
    result = stepAddressSchema.safeParse({
      rt: form.rt,
      address: form.address,
      category: form.category
    })
  }

  if (stepIndex === 1) {
    result = stepHeadSchema.safeParse({
      head: form.head
    })
  }

  if (stepIndex === 2) {
    result = stepSpouseSchema.safeParse({
      spouse: form.spouse
    })
  }

  if (stepIndex === 3) {
    result = stepFamilySchema.safeParse({
      childs: form.childs,
      others: form.others
    })
  }

  if (!result) return true

  if (!result.success) {
    showValidationError(result.error.issues[0]?.message || 'Data belum lengkap')
    return false
  }

  return true
}

const hydrateCompletedSteps = () => {
  const nextCompleted: number[] = []

  if (
    stepAddressSchema.safeParse({
      rt: form.rt,
      address: form.address,
      category: form.category
    }).success
  ) {
    nextCompleted.push(0)
  }

  if (stepHeadSchema.safeParse({ head: form.head }).success) {
    nextCompleted.push(1)
  }

  if (stepSpouseSchema.safeParse({ spouse: form.spouse }).success) {
    nextCompleted.push(2)
  }

  if (
    stepFamilySchema.safeParse({
      childs: form.childs,
      others: form.others
    }).success
  ) {
    nextCompleted.push(3)
  }

  completedSteps.value = nextCompleted
}

const nextStep = () => {
  const valid = validateStep(currentStep.value)
  if (!valid) return

  pushCompletedStep(currentStep.value)

  if (currentStep.value < 4) {
    currentStep.value += 1
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value -= 1
  }
}

const validateFinalForm = () => {
  const result = FamilyCardFormSchema.safeParse(form)

  if (!result.success) {
    showValidationError(result.error.issues[0]?.message || 'Data belum lengkap')
    return false
  }

  return true
}

// =========================
// API
// =========================

const getData = async () => {
  loading.value = true

  try {
    const res = await useApi('/familly/get', {
      params: {
        rt: selectedRT.value,
        page: pagination.value.current_page,
        limit: pagination.value.per_page
      }
    })

    if (res.status === 1) {
      dataFamilyCard.value = res.data
      if (res.pagination) { pagination.value = { ...res.pagination } }
    }
  } finally {
    loading.value = false
  }
}

const openAddModal = async () => {
  resetForm()

  await Promise.all([getDropdownRT(), getDropdownResidenceCategory()])

  mode.value = 'add'
  isOpen.value = true
}

const openEditModal = async (row: any) => {
  loadingEdit.value = true

  try {
    resetForm()
    mode.value = 'edit'
    editingId.value = row.id

    await Promise.all([getDropdownRT(), getDropdownResidenceCategory()])

    const res = await useApi(`/familly/show/${row.id}`)

    if (res.status === 1) {
      const d = res.data

      form.rt = d.rt || ''
      await getDropdownAddress(d.rt)

      form.address = d.address || ''
      form.category = d.head?.category || ''

      form.head = {
        ...createHead(),
        ...d.head,
        name: d.head?.name ?? '',
        phone: d.head?.phone ?? '',
        gender: d.head?.gender ?? '',
        dob: d.head?.dob ?? '',
        pob: d.head?.pob ?? '',
        nik: d.head?.nik ?? null,
        religion: d.head?.religion ?? '',
        avatar: d.head?.avatar ?? null,
        blood_type: d.head?.blood_type ?? null,
        email: d.head?.email ?? null,
        job: d.head?.job ?? null,
        nationality: d.head?.nationality ?? null,
        last_education: d.head?.last_education ?? null
      }

      form.spouse = d.spouse
        ? {
            ...createResident(),
            ...d.spouse,
            name: d.spouse?.name ?? '',
            phone: d.spouse?.phone ?? null,
            gender: d.spouse?.gender ?? '',
            dob: d.spouse?.dob ?? '',
            pob: d.spouse?.pob ?? '',
            nik: d.spouse?.nik ?? null,
            religion: d.spouse?.religion ?? '',
            avatar: d.spouse?.avatar ?? null,
            blood_type: d.spouse?.blood_type ?? null,
            email: d.spouse?.email ?? null,
            job: d.spouse?.job ?? null,
            nationality: d.spouse?.nationality ?? null,
            last_education: d.spouse?.last_education ?? null
          }
        : null

      form.childs =
        d.childs?.map((c: any) => ({
          ...createResident(),
          ...c,
          name: c?.name ?? '',
          phone: c?.phone ?? null,
          gender: c?.gender ?? '',
          dob: c?.dob ?? '',
          pob: c?.pob ?? '',
          nik: c?.nik ?? null,
          religion: c?.religion ?? '',
          avatar: c?.avatar ?? null,
          blood_type: c?.blood_type ?? null,
          email: c?.email ?? null,
          job: c?.job ?? null,
          nationality: c?.nationality ?? null,
          last_education: c?.last_education ?? null
        })) || []

      form.others =
        d.others?.map((o: any) => ({
          ...createResident(),
          ...o,
          name: o?.name ?? '',
          phone: o?.phone ?? null,
          gender: o?.gender ?? '',
          dob: o?.dob ?? '',
          pob: o?.pob ?? '',
          nik: o?.nik ?? null,
          religion: o?.religion ?? '',
          avatar: o?.avatar ?? null,
          blood_type: o?.blood_type ?? null,
          email: o?.email ?? null,
          job: o?.job ?? null,
          nationality: o?.nationality ?? null,
          last_education: o?.last_education ?? null
        })) || []

      hydrateCompletedSteps()
    }

    isOpen.value = true
  } finally {
    loadingEdit.value = false
  }
}

const saveData = async (event: FormSubmitEvent<FamilyCardFormSchema>) => {
  try {
    loading.value = true

    if (!validateFinalForm()) return

    if (mode.value === 'add') {
      const payload = {
        address: event.data.address,
        category: event.data.category,
        head: event.data.head,
        spouse: event.data.spouse,
        childs: event.data.childs,
        others: event.data.others
      }

      const res = await useApi('/familly/registration', {
        method: 'POST',
        body: payload
      })

      if (res.status === 1) {
        toast.add({
          title: 'Registrasi keluarga berhasil',
          color: 'success'
        })

        isOpen.value = false
        getData()
      }
    } else {
      const payload = {
        useraname_head: form.head?.username || null,
        head: form.head,
        spouse: form.spouse,
        childs: form.childs,
        others: form.others,
        total:
          1 + (form.spouse ? 1 : 0) + form.childs.length + form.others.length,
        rt: form.rt,
        address: form.address
      }

      const res = await useApi(`/familly/${editingId.value}`, {
        method: 'PUT',
        body: payload
      })

      if (res.status === 1) {
        toast.add({
          title: 'Data keluarga berhasil diupdate',
          color: 'success'
        })

        isOpen.value = false
        getData()
      }
    }
  } catch (err: any) {
    toast.add({
      title: err?.message || 'Terjadi kesalahan',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const confirmDelete = async (id: string) => {
  const ok = await confirm({
    title: 'Hapus Data Keluarga?',
    description: 'Data yang dihapus tidak dapat dikembalikan.',
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  try {
    loading.value = true

    const res = await useApi(`/familly/${id}`, {
      method: 'DELETE'
    })

    if (res.status === 1) {
      toast.add({
        title: 'Berhasil menghapus keluarga',
        color: 'success'
      })

      getData()
    }
  } finally {
    loading.value = false
  }
}

const toggleFamily = async (row: any) => {
  const isActive = row.is_active
  const label = isActive ? 'Nonaktifkan' : 'Aktifkan'
  const desc = isActive ? 'dinonaktifkan' : 'diaktifkan'

  const ok = await confirm({
    title: `${label} Keluarga?`,
    description: `Keluarga dengan kepala ${row.head} akan ${desc}.`,
    confirmLabel: `Ya, ${label}`,
    cancelLabel: 'Batal',
    color: isActive ? 'error' : 'primary'
  })
  if (!ok) return

  loadingToggle.value = true
  try {
    const res = await useApi(`/familly/toggle/${row.id}`, {
      method: 'PATCH'
    })
    if (res.status === 1) {
      toast.add({
        title: `Keluarga berhasil di${desc}`,
        color: 'success'
      })
      getData()
    }
  } catch (err: any) {
    toast.add({
      title: err?.data?.message || err?.message || `Gagal ${desc.toLowerCase()} keluarga`,
      color: 'error'
    })
  } finally {
    loadingToggle.value = false
  }
}

// =========================
// WATCH
// =========================

watch(
  () => pagination.value.per_page,
  () => {
    pagination.value.current_page = 1
    getData()
  }
)

onMounted(() => {
  getDropdownRT()
  getData()
})
</script>

<template>
  <div class="space-y-4">
    <ConfirmDialog />

    <SharedHeaderBg>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary-50 rounded-lg">
          <UIcon name="i-lucide-users-round" class="w-5 h-5 text-primary-600" />
        </div>
        <h2 class="text-lg font-bold text-gray-900">Manajemen Data Keluarga</h2>
      </div>

      <div class="flex items-center gap-3">
        <USelectMenu
          v-model="selectedRT"
          placeholder="Filter RT"
          :items="dropdownRT"
          value-key="key"
          label-key="label"
          class="w-48"
          clear
          @change="getData"
        />
        <UButton
          color="neutral"
          icon="i-lucide-plus-circle"
          @click="openAddModal"
        >
          Tambah Keluarga
        </UButton>
      </div>
    </SharedHeaderBg>

    <div
      class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <UTable
        :data="dataFamilyCard"
        :columns="columnsFamilyTable"
        :loading="loading"
      >
        <template #status-cell="{ row }">
          <UButton
            :color="row.original.is_active ? 'success' : 'error'"
            variant="soft"
            size="xs"
            :loading="loadingToggle"
            @click="toggleFamily(row.original)"
          >
            {{ row.original.is_active ? 'Aktif' : 'Nonaktif' }}
          </UButton>
        </template>
        <template #action-cell="{ row }">
          <div class="flex gap-1">
            <UButton
              icon="i-lucide-pencil"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="openEditModal(row.original)"
            />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="sm"
              @click="confirmDelete(row.original.id)"
            />
          </div>
        </template>
      </UTable>
    </div>

    <div class="flex justify-between">
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <span>Tampilkan</span>
        <USelect
          v-model.number="pagination.per_page"
          :items="perPageLimit"
          value-attribute="value"
          option-attribute="label"
          class="w-24"
        />
      </div>

      <UPagination
        v-model:page="pagination.current_page"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        @update:page="getData"
      />
    </div>

    <UModal v-model:open="isOpen" :ui="{ content: 'min-w-4xl' }">
      <template #header>
        <div class="flex flex-col gap-4 w-full">
          <h2 class="font-bold text-lg">
            {{ mode === 'add' ? 'Registrasi Keluarga' : 'Edit Keluarga' }}
          </h2>

          <UStepper v-model="currentStep" :items="stepItems" />
        </div>
      </template>

      <template #body>
        <UForm
          :schema="FamilyCardFormSchema"
          :state="form"
          class="space-y-6"
          @submit="saveData"
        >
          <!-- STEP 1 -->
          <div v-if="currentStep === 0" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <UFormField name="rt" label="RT" required>
                <USelect
                  v-model="form.rt"
                  :items="dropdownRT"
                  value-key="key"
                  label-key="label"
                  @change="addressHandler"
                />
              </UFormField>

              <UFormField name="category" label="Kategori Tinggal" required>
                <USelect
                  v-model="form.category"
                  :items="dropdownResidenceCategory"
                  value-key="key"
                  label-key="label"
                />
              </UFormField>
            </div>

            <UFormField name="address" label="Alamat / Kavling" required>
              <USelect
                v-model="form.address"
                :items="dropdownAddress"
                :disabled="!form.rt"
                value-key="key"
                label-key="label"
              />
            </UFormField>

            <div class="flex justify-end">
              <UButton type="button" @click="nextStep"> Lanjut </UButton>
            </div>
          </div>

          <!-- STEP 2 -->
          <div v-if="currentStep === 1" class="grid grid-cols-2 gap-4">
            <UFormField name="head.name" label="Nama" required>
              <UInput v-model="form.head.name" />
            </UFormField>

            <UFormField name="head.phone" label="No HP" required>
              <UInput v-model="form.head.phone" />
            </UFormField>

            <UFormField name="head.gender" label="Jenis Kelamin" required>
              <USelectMenu
                v-model="form.head.gender"
                :items="genderItems"
                value-key="key"
                label-key="label"
                size="xl"
                :ui="{ base: 'rounded-2xl' }"
              />
            </UFormField>

            <UFormField name="head.dob" label="Tanggal Lahir" required>
              <UInput v-model="form.head.dob" type="date" />
            </UFormField>

            <UFormField name="head.pob" label="Tempat Lahir" required>
              <UInput v-model="form.head.pob" />
            </UFormField>

            <UFormField name="head.religion" label="Agama" required>
              <USelectMenu
                v-model="form.head.religion"
                :items="religionOptions"
                value-key="key"
                label-key="label"
                size="xl"
                class="w-full"
              />
            </UFormField>

            <UFormField name="head.nik" label="NIK">
              <UInput v-model="form.head.nik" />
            </UFormField>

            <UFormField name="head.job" label="Pekerjaan">
              <UInput v-model="form.head.job" />
            </UFormField>

            <div class="col-span-2 flex justify-between">
              <UButton type="button" variant="soft" @click="prevStep">
                Kembali
              </UButton>
              <UButton type="button" @click="nextStep"> Lanjut </UButton>
            </div>
          </div>

          <!-- STEP 3 -->
          <div v-if="currentStep === 2" class="space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="font-semibold">Data Pasangan</h3>

              <UButton v-if="!form.spouse" type="button" @click="enableSpouse">
                Tambah Pasangan
              </UButton>

              <UButton
                v-else
                type="button"
                color="error"
                variant="soft"
                @click="removeSpouse"
              >
                Hapus Pasangan
              </UButton>
            </div>

            <div v-if="form.spouse" class="grid grid-cols-2 gap-4">
              <UFormField name="spouse.name" label="Nama" required>
                <UInput v-model="form.spouse.name" />
              </UFormField>

              <UFormField name="spouse.phone" label="No HP">
                <UInput v-model="form.spouse.phone" />
              </UFormField>

              <UFormField name="spouse.gender" label="Jenis Kelamin" required>
                <USelectMenu
                  v-model="form.spouse.gender"
                  :items="genderItems"
                  value-key="key"
                  label-key="label"
                  size="xl"
                  :ui="{ base: 'rounded-2xl' }"
                />
              </UFormField>

              <UFormField name="spouse.dob" label="Tanggal Lahir" required>
                <UInput v-model="form.spouse.dob" type="date" />
              </UFormField>

              <UFormField name="spouse.pob" label="Tempat Lahir" required>
                <UInput v-model="form.spouse.pob" />
              </UFormField>

              <UFormField name="spouse.religion" label="Agama" required>
                <USelectMenu
                  v-model="form.spouse.religion"
                  :items="religionOptions"
                  value-key="key"
                  label-key="label"
                  size="xl"
                  class="w-full"
                />
              </UFormField>

              <UFormField name="spouse.nik" label="NIK">
                <UInput v-model="form.spouse.nik" />
              </UFormField>

              <UFormField name="spouse.job" label="Pekerjaan">
                <UInput v-model="form.spouse.job" />
              </UFormField>
            </div>

            <div class="flex justify-between pt-4">
              <UButton type="button" variant="soft" @click="prevStep">
                Kembali
              </UButton>
              <UButton type="button" @click="nextStep"> Lanjut </UButton>
            </div>
          </div>

          <!-- STEP 4 -->
          <div v-if="currentStep === 3" class="space-y-8">
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <h3 class="font-semibold">Daftar Anak</h3>
                <UButton type="button" @click="addChild">Tambah Anak</UButton>
              </div>

              <div
                v-for="(child, index) in form.childs"
                :key="index"
                class="border rounded-xl p-4 space-y-4"
              >
                <div class="flex justify-between">
                  <h4 class="font-medium">Anak {{ index + 1 }}</h4>
                  <UButton
                    type="button"
                    color="error"
                    variant="ghost"
                    @click="removeChild(index)"
                  >
                    Hapus
                  </UButton>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <UFormField
                    :name="`childs.${index}.name`"
                    label="Nama"
                    required
                  >
                    <UInput v-model="child.name" />
                  </UFormField>

                  <UFormField :name="`childs.${index}.phone`" label="No HP">
                    <UInput v-model="child.phone" />
                  </UFormField>

                  <UFormField
                    :name="`childs.${index}.gender`"
                    label="Jenis Kelamin"
                    required
                  >
                    <USelectMenu
                      v-model="child.gender"
                      :items="genderItems"
                      value-key="key"
                      label-key="label"
                      size="xl"
                      :ui="{ base: 'rounded-2xl' }"
                    />
                  </UFormField>

                  <UFormField
                    :name="`childs.${index}.dob`"
                    label="Tanggal Lahir"
                    required
                  >
                    <UInput v-model="child.dob" type="date" />
                  </UFormField>

                  <UFormField
                    :name="`childs.${index}.pob`"
                    label="Tempat Lahir"
                    required
                  >
                    <UInput v-model="child.pob" />
                  </UFormField>

                  <UFormField
                    :name="`childs.${index}.religion`"
                    label="Agama"
                    required
                  >
                    <USelectMenu
                      v-model="child.religion"
                      :items="religionOptions"
                      value-key="key"
                      label-key="label"
                      size="xl"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField :name="`childs.${index}.nik`" label="NIK">
                    <UInput v-model="child.nik" />
                  </UFormField>

                  <UFormField :name="`childs.${index}.job`" label="Pekerjaan">
                    <UInput v-model="child.job" />
                  </UFormField>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <h3 class="font-semibold">Anggota Lainnya</h3>
                <UButton type="button" @click="addOthers"
                  >Tambah Anggota</UButton
                >
              </div>

              <div
                v-for="(item, index) in form.others"
                :key="index"
                class="border rounded-xl p-4 space-y-4"
              >
                <div class="flex justify-between">
                  <h4 class="font-medium">Anggota {{ index + 1 }}</h4>
                  <UButton
                    type="button"
                    color="error"
                    variant="ghost"
                    @click="removeOthers(index)"
                  >
                    Hapus
                  </UButton>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <UFormField
                    :name="`others.${index}.name`"
                    label="Nama"
                    required
                  >
                    <UInput v-model="item.name" />
                  </UFormField>

                  <UFormField :name="`others.${index}.phone`" label="No HP">
                    <UInput v-model="item.phone" />
                  </UFormField>

                  <UFormField
                    :name="`others.${index}.gender`"
                    label="Jenis Kelamin"
                    required
                  >
                    <USelectMenu
                      v-model="item.gender"
                      :items="genderItems"
                      value-key="key"
                      label-key="label"
                      size="xl"
                      :ui="{ base: 'rounded-2xl' }"
                    />
                  </UFormField>

                  <UFormField
                    :name="`others.${index}.dob`"
                    label="Tanggal Lahir"
                    required
                  >
                    <UInput v-model="item.dob" type="date" />
                  </UFormField>

                  <UFormField
                    :name="`others.${index}.pob`"
                    label="Tempat Lahir"
                    required
                  >
                    <UInput v-model="item.pob" />
                  </UFormField>

                  <UFormField
                    :name="`others.${index}.religion`"
                    label="Agama"
                    required
                  >
                    <USelectMenu
                      v-model="item.religion"
                      :items="religionOptions"
                      value-key="key"
                      label-key="label"
                      size="xl"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField :name="`others.${index}.nik`" label="NIK">
                    <UInput v-model="item.nik" />
                  </UFormField>

                  <UFormField :name="`others.${index}.job`" label="Pekerjaan">
                    <UInput v-model="item.job" />
                  </UFormField>
                </div>
              </div>
            </div>

            <div class="flex justify-between pt-4">
              <UButton type="button" variant="soft" @click="prevStep">
                Kembali
              </UButton>
              <UButton type="button" @click="nextStep"> Lanjut </UButton>
            </div>
          </div>

          <!-- STEP 5 -->
          <div v-if="currentStep === 4" class="space-y-4">
            <div class="rounded-xl border p-4">
              <h3 class="font-semibold mb-2">Ringkasan Keluarga</h3>

              <div class="space-y-2 text-sm">
                <p><strong>Kategori:</strong> {{ form.category || '-' }}</p>
                <p><strong>Kepala:</strong> {{ form.head.name || '-' }}</p>
                <p><strong>Pasangan:</strong> {{ form.spouse?.name || '-' }}</p>
                <p><strong>Total Anak:</strong> {{ form.childs.length }}</p>
                <p><strong>Anggota Lain:</strong> {{ form.others.length }}</p>
              </div>
            </div>

            <div class="flex justify-between pt-4 border-t">
              <UButton type="button" variant="soft" @click="prevStep">
                Kembali
              </UButton>

              <div class="flex gap-3">
                <UButton type="button" variant="ghost" @click="isOpen = false">
                  Batal
                </UButton>

                <UButton type="submit" color="neutral" :loading="loading">
                  Simpan Keluarga
                </UButton>
              </div>
            </div>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
