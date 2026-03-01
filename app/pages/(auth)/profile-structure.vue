<script setup lang="ts">
import { z } from 'zod'
import type { TabsItem } from '@nuxt/ui'
import { useRtStructure } from '~/composables/structure/useRtOrg'
import { useRwStructure } from '~/composables/structure/useRwOrg'
import type { OrgNode, Mode, BEResponseNode } from '~/types/org'
import type { FormSubmitEvent } from '#ui/types'
import OrgChart from '~/components/OrgChart.vue'
import { fileUpload } from '~/services/files'

const { selectedRT, rtData, rtOrgData, fetchRtOrg, fetchRt, addRT, deleteRT } =
  useRtStructure()
const { rwData, fetchRw } = useRwStructure()
const {
  dropdownRT,
  dropdownPosition,
  dropdownFamilyHead,
  dropdownPositionRW,
  getDropdownRT,
  getDropdownPosition,
  getDropdownFamilyHead,
  getDropdownPositionRW
} = useApiDropdown()

const toast = useToast()
const { reveal: confirm } = useConfirmService()

const orgFormSchema = z.object({
  parent: z.string().optional(),
  name: z.string().min(1, 'Nama wajib diisi')
})

const orgFormAssignSchema = z.object({
  position: z.string().min(1, 'Jabatan wajib diisi'),
  person: z.string().min(1, 'Nama wajib diisi'),
  signature: z.string().optional()
})

const orgFormRTSchema = z.object({
  name: z.string().min(1, 'Nama organisasi wajib diisi')
})

export type OrgFormSchema = z.infer<typeof orgFormSchema>
export type OrgFormAssignSchema = z.infer<typeof orgFormAssignSchema>

const isOpen = ref(false)
const isOpenAssign = ref(false)
const mode = ref<Mode>('add')
const selectedRTForm = ref('')
const selectedPosition = ref<OrgNode>()
const isLoading = ref(false)
const signatureFile = ref(null)
const activeTab = ref('0')
const isOpenOrganization = ref(false)

const formOrganization = reactive<any>({
  name: ''
})

const form = reactive<OrgFormSchema>({
  parent: '',
  name: ''
})

const formAssign = reactive<OrgFormAssignSchema>({
  position: '',
  person: '',
  signature: ''
})

const tabs = [
  { label: 'RW', slot: 'rw' },
  { label: 'RT', slot: 'rt' }
] satisfies TabsItem[]

/* =========================
  ACTIONS
========================= */
const clearImage = () => {
  if (formAssign.signature?.startsWith('blob:')) {
    URL.revokeObjectURL(formAssign.signature)
  }
  formAssign.signature = ''
  signatureFile.value = null
}

const resetForm = () => {
  form.parent = ''
  form.name = ''
}

const resetFormAssign = () => {
  formAssign.person = ''
  formAssign.position = ''
  formAssign.signature = ''
  signatureFile.value = null
}

const openAddModal = () => {
  mode.value = 'add'
  resetForm()
  isOpen.value = true
}

const openEditModal = async (node: OrgNode) => {
  mode.value = 'edit'
  selectedPosition.value = node
  form.name = node.title
  isOpen.value = true
}

const openEditAssignModal = async (node: OrgNode) => {
  resetFormAssign()
  await getDropdownFamilyHead()

  formAssign.person = node?.incumbent_id || ''
  formAssign.position = node.id
  formAssign.signature = node.signature
  isOpenAssign.value = true
}

const deletePosition = async () => {
  isOpen.value = false
  const ok = await confirm({
    title: 'Hapus Data Struktur?',
    description: `Apakah Anda yakin ingin menghapus data ini?`,
    confirmLabel: 'Hapus',
    cancelLabel: 'Batal',
    color: 'error'
  })

  if (!ok) return

  isLoading.value = true
  try {
    const response = await useApi<BEResponseNode>(
      `/position/${selectedPosition?.value?.id}`,
      {
        method: 'DELETE'
      }
    )

    if (response.status === 1) {
      toast.add({ title: 'Berhasil menghapus data', color: 'success' })
      if (activeTab.value === '0') fetchRw()
      else fetchRt()
    }
  } catch (err: any) {
    toast.add({
      title: 'Gagal menghapus struktur',
      description: err?.message || 'Terjadi kesalahan sistem',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

const handleOrganizationSubmit = (event: FormSubmitEvent<any>) => {
  addRT(event.data.name)
  toast.add({ title: 'Berhasil menambahkan struktur', color: 'success' })
  formOrganization.name = ''
}

const saveData = async (event: FormSubmitEvent<OrgFormSchema>) => {
  isLoading.value = true
  try {
    if (mode.value === 'add') {
      const response = await useApi<BEResponseNode>('/position', {
        method: 'POST',
        body: {
          parent: event.data.parent,
          name: event.data.name
        }
      })

      if (response.status === 1) {
        toast.add({ title: 'Berhasil menambahkan struktur', color: 'success' })
        if (activeTab.value === '0') fetchRw()
        else fetchRt()

        isOpen.value = false
      }
    } else {
      const response = await useApi<BEResponseNode>(
        `/position/${selectedPosition?.value?.id}`,
        {
          method: 'PUT',
          body: {
            name: event.data.name
          }
        }
      )

      if (response.status === 1) {
        toast.add({ title: 'Berhasil merubah data struktur', color: 'success' })
        if (activeTab.value === '0') fetchRw()
        else fetchRt()

        isOpen.value = false
      }
    }
  } catch (err: any) {
    toast.add({
      title: 'Gagal menambahkan struktur',
      description: err?.message || 'Terjadi kesalahan sistem',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

const saveAssignData = async (event: FormSubmitEvent<OrgFormSchema>) => {
  isLoading.value = true
  try {
    let finalImageUrl = formAssign.signature
    if (signatureFile.value) {
      const uploadRes = await fileUpload(signatureFile.value)
      if (uploadRes) finalImageUrl = uploadRes
      else {
        throw new Error('Gagal mengunggah gambar ke server')
      }
    }

    const payload = {
      ...event.data,
      signature: finalImageUrl
    }

    const response = await useApi<BEResponseNode>('/position/assign', {
      method: 'POST',
      body: { ...payload }
    })

    if (response.status === 1) {
      toast.add({ title: 'Berhasil assign pejabat', color: 'success' })
      isOpenAssign.value = false
      if (activeTab.value === '0') fetchRw()
      else fetchRt()
    }
  } catch (err: any) {
    toast.add({
      title: 'Gagal menambahkan assign',
      description: err?.message || 'Terjadi kesalahan sistem',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

watch(signatureFile, (newFiles) => {
  if (newFiles) {
    if (formAssign.signature?.startsWith('blob:')) {
      URL.revokeObjectURL(formAssign.signature)
    }
    formAssign.signature = URL.createObjectURL(newFiles)
  }
})

watch(isOpen, () => {
  if (activeTab.value === '0') {
    getDropdownPositionRW()
  }
})

onMounted(() => {
  getDropdownRT()
  fetchRw()
  fetchRtOrg()
})

definePageMeta({
  middleware: ['auth']
})
</script>

<template>
  <div class="w-full">
    <ConfirmDialog />

    <!-- MODAL FORM -->
    <UModal v-model:open="isOpen" size="md" class="w-full">
      <template #header>
        <span class="font-bold"
          >{{ mode === 'add' ? 'Tambah' : 'Edit' }} Struktur</span
        >
      </template>

      <template #body>
        <UForm
          :schema="orgFormSchema"
          :state="form"
          class="w-full space-y-4"
          @submit="saveData"
        >
          <UFormField
            v-if="mode === 'add' && activeTab === '1'"
            name="rt"
            required
            class="w-full"
          >
            <USelect
              v-model="selectedRTForm"
              :items="dropdownRT"
              orientation="horizontal"
              class="w-full"
              placeholder="Pilih RT"
              value-key="key"
              value-label="label"
              @change="getDropdownPosition(selectedRTForm)"
            />
          </UFormField>

          <UFormField
            v-if="mode === 'add'"
            name="parent"
            label="Di Bawah Koordinasi"
            required
            class="w-full"
          >
            <USelect
              v-model="form.parent"
              :items="activeTab === '1' ? dropdownPosition : dropdownPositionRW"
              orientation="horizontal"
              class="w-full"
              placeholder="Pilih jabatan koordinasi"
              value-key="key"
              value-label="label"
            />
          </UFormField>

          <UFormField name="name" label="Nama Jabatan" required class="w-full">
            <UInput
              v-model="form.name"
              class="w-full"
              placeholder="Nama Jabatan"
            />
          </UFormField>

          <div class="flex w-full items-center justify-between gap-2">
            <UButton
              v-if="mode === 'edit'"
              variant="subtle"
              @click="deletePosition"
            >
              Hapus
            </UButton>

            <div class="ml-auto flex gap-2">
              <UButton variant="ghost" @click="isOpen = false"> Batal </UButton>
              <UButton type="submit" color="neutral"> Simpan </UButton>
            </div>
          </div>
        </UForm>
      </template>
    </UModal>

    <div
      class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4 mb-4"
    >
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
      >
        <div class="flex gap-2">
          <UButton
            v-if="activeTab == '1'"
            color="neutral"
            variant="solid"
            icon="mdi:account-group"
            @click="isOpenOrganization = true"
          >
            Lihat Struktur
          </UButton>

          <UButton color="neutral" variant="outline" icon="i-lucide-download">
            Download
          </UButton>
        </div>

        <UButton
          color="neutral"
          icon="mdi-plus-circle-outline"
          @click="openAddModal()"
        >
          Tambah Struktur
        </UButton>
      </div>
    </div>

    <!-- MODAL FORM ASSIGN -->
    <UModal v-model:open="isOpenAssign" size="md" class="w-full">
      <template #header>
        <span class="font-bold">Assign Pejabat</span>
      </template>

      <template #body>
        <UForm
          :schema="orgFormAssignSchema"
          :state="formAssign"
          class="w-full space-y-4"
          @submit="saveAssignData"
        >
          <!-- LEVEL -->
          <UFormField name="person" required class="w-full">
            <USelect
              v-model="formAssign.person"
              :items="dropdownFamilyHead"
              orientation="horizontal"
              class="w-full"
              placeholder="Pilih Person"
              value-key="key"
              value-label="label"
            />
          </UFormField>

          <UFormField name="signature">
            <div class="w-full">
              <div
                v-if="formAssign.signature"
                class="group relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
              >
                <img
                  :src="formAssign.signature"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <UButton
                    color="error"
                    variant="solid"
                    icon="i-lucide-trash-2"
                    label="Hapus & Ganti Gambar"
                    @click="clearImage"
                  />
                </div>
              </div>

              <UFileUpload
                v-else
                v-model="signatureFile"
                accept="image/*"
                :dropzone="true"
                class="aspect-video"
                icon="uil:image-upload"
                :ui="{
                  base: 'bg-neutral-100'
                }"
              />
            </div>
          </UFormField>

          <div class="flex w-full items-center justify-between gap-2">
            <div class="ml-auto flex gap-2">
              <UButton variant="ghost" @click="isOpenAssign = false">
                Batal
              </UButton>
              <UButton type="submit" color="neutral"> Simpan </UButton>
            </div>
          </div>
        </UForm>
      </template>
    </UModal>

    <UModal
      v-model:open="isOpenOrganization"
      size="md"
      class="w-full"
      close-icon="mdi-close"
    >
      <template #header>
        <span class="font-bold">Management Organisasi</span>
      </template>

      <template #body>
        <UForm
          :schema="orgFormRTSchema"
          :state="formOrganization"
          class="w-full space-y-4"
          @submit.prevent="handleOrganizationSubmit"
        >
          <div class="flex gap-4">
            <UFormField name="name" required class="w-full">
              <UInput
                v-model="formOrganization.name"
                class="w-full"
                placeholder="Isi kan nama RT"
              />
            </UFormField>
            <UButton type="submit" color="neutral"> Simpan </UButton>
          </div>
        </UForm>

        <UTable
          ref="table"
          :data="rtOrgData"
          :columns="[
            { accessorKey: 'name', header: 'Nama Organisasi' },
            { id: 'action', header: 'Aksi' }
          ]"
          class="my-4"
        >
          <template #action-cell="{ row }">
            <div class="flex gap-1">
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                color="error"
                @click="deleteRT(row.original.id)"
              />
            </div>
          </template>
        </UTable>
      </template>
    </UModal>

    <UTabs
      v-model="activeTab"
      :items="tabs"
      variant="link"
      class="mb-6 w-full"
      :ui="{
        label: 'text-md group-data-[state=inactive]:text-black w-20',
        indicator: 'h-1 bg-primary-600',
        list: 'px-0'
      }"
    >
      <template #rw>
        <div class="flex w-full justify-center">
          <div v-if="rwData">
            <OrgChart
              :datasource="rwData"
              @node-click="openEditModal"
              @name-click="openEditAssignModal"
            />
          </div>
          <div v-else class="loading text-neutral-400 italic text-center py-8">
            Memuat Struktur RW...
          </div>
        </div>
      </template>

      <template #rt>
        <div class="my-4 flex flex-col w-full justify-center gap-4">
          <USelectMenu
            v-model="selectedRT"
            placeholder="Pilih RT"
            :search-input="{
              placeholder: 'Cari nama RT'
            }"
            :items="dropdownRT"
            value-key="key"
            searchable
            class="w-40"
          />
        </div>

        <div class="flex w-full justify-center pt-8">
          <div v-if="selectedRT && rtData">
            <OrgChart
              :datasource="rtData"
              accent-color="success"
              @node-click="openEditModal"
              @name-click="openEditAssignModal"
            />
          </div>
          <div
            v-else-if="!selectedRT"
            class="text-neutral-400 italic text-center"
          >
            Silahkan pilih RT untuk menampilkan bagan organisasi.
          </div>
          <div v-else class="text-neutral-400 italic">Memuat data RT...</div>
        </div>
      </template>
    </UTabs>
  </div>
</template>
