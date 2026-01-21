<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/vue-table'
import { z } from 'zod'

const { reveal: confirm } = useConfirmService()
const tableHome = useTemplateRef('table')
const selectedRT = ref('RT 01')
const isOpen = ref(false)
const mode = ref<'add' | 'edit'>('add')
const editingIndex = ref<number | null>(null)
const rtItems = ['RT 01', 'RT 02', 'RT 03', 'RT 04']

const HomeFormSchema = z.object({
  pic: z.string().min(1, 'Penanggung Jawab wajib diisi'),
  pic_nik: z.string().min(16, 'NIK Penanggung Jawab wajib diisi'),
  house_area: z.number().min(1, 'Luas Rumah wajib diisi'),
  rt: z.string().min(1, 'RT wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),
  family_member_residents: z.array(
    z.object({
      name: z.string().min(1, 'Nama wajib diisi'),
      nik: z.string().min(16, 'NIK wajib diisi')
    })
  ),
  others_member_residents: z.array(
    z.object({
      name: z.string().optional(),
      nik: z.string().optional(),
      status: z.string().optional()
    })
  )
})

type HomeFormSchema = z.infer<typeof HomeFormSchema>

const dataHome = ref([
  {
    pic: 'Jeffery Warden',
    address: 'Jl. Bukit Wahid Raya No. 12',
    pic_nik: '1234567890123450',
    house_area: 120,
    rt: 'RT 01',
    total: 6,
    family_members_residents: [
      {
        name: 'Anna Warden',
        nik: '1234567890123456'
      },
      {
        name: 'Bobby Warden',
        nik: '1234567890123457'
      },
      {
        name: 'Cindy Warden',
        nik: '1234567890123458'
      }
    ],
    others_member_residents: [{
      name: 'Siti Aminah',
      status: 'ART'
    }, {
      name: 'Budi Santoso',
      status: 'Supir'
    }]
  }
])

const columnsFamilyTable = [
  {
    accessorKey: 'pic',
    header: 'Penanggung Jawab'
  },
  {
    accessorKey: 'total',
    header: 'Anggota Dalam Rumah'
  },
  {
    accessorKey: 'family_members_residents',
    header: 'Penghuni'
  },
  {
    accessorKey: 'others_member_residents',
    header: 'Pegawai'
  },
  {
    id: 'action',
    header: 'Aksi'
  }
]

const pagination = ref({
  pageIndex: 0,
  pageSize: 5
})

/* =========================
  FORM STATE
========================= */
interface Home {
  pic: string
  pic_nik: string
  house_area: number
  rt: string
  address: string
  family_members_residents: {
    name: string
    nik: string
  }[]
  others_member_residents: {
    name: string
    nik: string
    status: string
  }[]
}

const form = reactive<Home>({
  pic: '',
  pic_nik: '',
  house_area: 0,
  rt: '',
  address: '',
  family_members_residents: [
    {
      name: '',
      nik: ''
    }
  ],
  others_member_residents: [
    {
      name: '',
      nik: '',
      status: ''
    }
  ]
})

const resetForm = () => {
  form.pic = ''
  form.pic_nik = ''
  form.house_area = 0
  form.rt = ''
  form.address = ''
  form.family_members_residents = [
    {
      name: '',
      nik: ''
    }
  ]
  form.others_member_residents = [
    {
      name: '',
      nik: '',
      status: ''
    }
  ]
}

const openAddModal = () => {
  resetForm()
  mode.value = 'add'
  editingIndex.value = null
  isOpen.value = true
}

const openEditModal = (row: Home, index: number) => {
  mode.value = 'edit'
  editingIndex.value = index

  form.pic = row.pic
  form.pic_nik = row.pic_nik
  form.house_area = row.house_area
  form.rt = row.rt
  form.address = row.address
  form.family_members_residents = JSON.parse(JSON.stringify(row.family_members_residents))
  form.others_member_residents = JSON.parse(JSON.stringify(row.others_member_residents))

  isOpen.value = true
}

const confirmDelete = async (index: number) => {
  const ok = await confirm({
    title: 'Hapus Data Keluarga?',
    description: 'Data yang dihapus tidak dapat dikembalikan.',
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  dataHome.value.splice(index, 1)
}

const saveData = async (event: FormSubmitEvent<HomeFormSchema>) => {
  const validated = event.data

  const payload: Home = {
    pic: validated.pic,
    pic_nik: validated.pic_nik,
    house_area: validated.house_area,
    rt: validated.rt,
    address: validated.address,
    family_members_residents: JSON.parse(JSON.stringify(validated.family_member_residents)),
    others_member_residents: JSON.parse(JSON.stringify(validated.others_member_residents))
  }

  if (mode.value === 'add') {
    dataHome.value.push(payload)
  }

  if (mode.value === 'edit' && editingIndex.value !== null) {
    dataHome.value.splice(editingIndex.value, 1, payload)
  }

  resetForm()
  isOpen.value = false
}
</script>

<template>
  <div>
    <ConfirmDialog />

    <div class="my-4 flex w-full justify-between gap-4">
      <USelect
        v-model="selectedRT"
        :items="rtItems"
        class="w-40"
      />

      <UButton
        color="neutral"
        trailing-icon="mdi-plus-circle-outline"
        @click="openAddModal"
      >
        Tambah Keluarga
      </UButton>

      <UModal
        v-model:open="isOpen"
        :ui="{ content: 'min-w-2xl' }"
      >
        <template #header>
          <span class="font-bold">{{ mode === 'add' ? 'Tambah' : 'Edit' }} Data Warga</span>
        </template>

        <template #body>
          <UForm
            :schema="HomeFormSchema"
            :state="form"
            class="w-full space-y-6"
            @submit="saveData"
          >
            <!-- Kartu Keluarga -->
            <UFormField
              name="pic"
              label="Penanggung Jawab"
              required
            >
              <UInput
                v-model="form.pic"
                placeholder="Penanggung Jawab"
              />
            </UFormField>

            <UFormField
              name="pic_nik"
              label="NIK Penanggung Jawab"
              required
            >
              <UInput
                v-model="form.pic_nik"
                placeholder="NIK Penanggung Jawab"
              />
            </UFormField>

            <div class="flex w-full gap-4">
              <UFormField
                name="house_area"
                label="Luas Rumah (m²)"
                required
                class="w-[25%]"
              >
                <UInput
                  v-model="form.house_area"
                  type="number"
                  placeholder="Luas Rumah"
                />
              </UFormField>

              <UFormField
                name="rt"
                label="RT"
                required
                class="min-w-[25%]"
              >
                <USelect
                  v-model="form.rt"
                  :items="rtItems"
                  class="w-full"
                  placeholder="Pilih RT"
                />
              </UFormField>

              <UFormField
                name="address"
                label="Alamat"
                required
                class="w-[50%]"
              >
                <UInput
                  v-model="form.address"
                  placeholder="Alamat"
                />
              </UFormField>
            </div>

            <div class="text-2xl mt-6 mb-4">
              Penghuni Anggota Keluarga
            </div>

            <UCard class="bg-neutral-100">
              <div class="grid grid-cols-2 gap-2">
                <template
                  v-for="(family, index) in form.family_members_residents"
                  :key="`wife-${index}`"
                >
                  <div class="col-span-2 grid grid-cols-12 gap-2 items-end">
                    <UFormField
                      :name="`family.${index}.name`"
                      :label="`Nama ${
                        form.family_members_residents.length > 1 ? index + 1 : ''
                      }`"
                      required
                      class="col-span-6"
                    >
                      <UInput v-model="family.name" />
                    </UFormField>

                    <UFormField
                      :name="`family.${index}.nik`"
                      :label="`NIK ${
                        form.family_members_residents.length > 1 ? index + 1 : ''
                      }`"
                      required
                      class="col-span-5"
                    >
                      <UInput v-model="family.nik" />
                    </UFormField>

                    <UButton
                      type="button"
                      color="error"
                      variant="ghost"
                      icon="mdi-trash-can-outline"
                      class="col-span-1"
                      :disabled="form.family_members_residents.length === 1"
                      @click="form.family_members_residents.splice(index, 1)"
                    />
                  </div>
                </template>
              </div>

              <div class="w-full text-center mt-4">
                <UButton
                  type="button"
                  variant="link"
                  color="info"
                  icon="mdi-plus-circle-outline"
                  @click="form.family_members_residents.push({ name: '', nik: '' })"
                >
                  Tambah Penghuni Anggota Keluarga
                </UButton>
              </div>
            </UCard>

            <div class="text-2xl mt-6 mb-4">
              Penghuni Lainnya
            </div>

            <UCard
              class="bg-neutral-100"
            >
              <div class="grid grid-cols-2 gap-2">
                <template
                  v-for="(other, index) in form.others_member_residents"
                  :key="`other-${index}`"
                >
                  <div class="col-span-2 grid grid-cols-12 gap-2 items-end">
                    <UFormField
                      :name="`other.${index}.name`"
                      :label="`Nama ${index + 1}`"
                      required
                      class="col-span-4"
                    >
                      <UInput v-model="other.name" />
                    </UFormField>

                    <UFormField
                      :name="`other.${index}.nik`"
                      :label="`NIK ${index + 1}`"
                      required
                      class="col-span-4"
                    >
                      <UInput v-model="other.nik" />
                    </UFormField>

                    <UFormField
                      :name="`other.${index}.status`"
                      :label="`Status ${index + 1}`"
                      required
                      class="col-span-3"
                    >
                      <UInput v-model="other.status" />
                    </UFormField>

                    <UButton
                      type="button"
                      color="error"
                      variant="ghost"
                      icon="mdi-trash-can-outline"
                      class="col-span-1 mb-1"
                      :disabled="form.others_member_residents.length === 1"
                      @click="form.others_member_residents.splice(index, 1)"
                    />
                  </div>
                </template>
              </div>

              <div class="w-full text-center mt-4">
                <UButton
                  type="button"
                  variant="link"
                  color="info"
                  icon="mdi-plus-circle-outline"
                  class="col-span-2"
                  @click="form.others_member_residents.push({ name: '', nik: '', status: '' })"
                >
                  Tambah Penghuni Lainnya
                </UButton>
              </div>
            </UCard>

            <div class="flex w-full items-center justify-between gap-2">
              <UButton
                variant="ghost"
                @click="isOpen = false"
              >
                Batal
              </UButton>

              <UButton
                type="submit"
                color="neutral"
              >
                Simpan
              </UButton>
            </div>
          </UForm>
        </template>
      </UModal>
    </div>

    <div>
      <UTable
        ref="table"
        v-model:pagination="pagination"
        :data="dataHome"
        :columns="columnsFamilyTable"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="flex-1"
      >
        <template #pic-cell="{ row }">
          <div class="font-bold">
            {{ row.original.pic }}
          </div>

          <div class="text-xs text-neutral-400">
            {{ row.original.address }}
          </div>
        </template>
        <template #family_members_residents-cell="{ row }">
          <div class="flex gap-1">
            <span
              v-for="(member, index) in row.original.family_members_residents"
              :key="`member-${index}`"
            >
              {{ member.name }}<span>{{ index < row.original.family_members_residents.length - 1 ? ',' : '' }}</span>
            </span>
          </div>
        </template>
        <template #others_member_residents-cell="{ row }">
          <div class="flex gap-1">
            <span
              v-for="(member, index) in row.original.others_member_residents"
              :key="`member-${index}`"
            >
              {{ member.name }}<span>{{ index < row.original.others_member_residents.length - 1 ? ',' : '' }}</span>
            </span>
          </div>
        </template>
        <template #action-cell="{ row, rowIndex }">
          <UButton
            icon="i-lucide-pencil"
            variant="ghost"
            @click="openEditModal(row.original, rowIndex)"
          />
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            @click="confirmDelete(rowIndex)"
          />
        </template>
      </UTable>

      <div class="flex justify-end border-t border-default pt-4 px-4">
        <UPagination
          :page="
            (tableHome?.tableApi?.getState().pagination.pageIndex || 0)
              + 1
          "
          :items-per-page="
            tableHome?.tableApi?.getState().pagination.pageSize
          "
          :total="tableHome?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p) => tableHome?.tableApi?.setPageIndex(p - 1)"
        />
      </div>
    </div>
  </div>
</template>
