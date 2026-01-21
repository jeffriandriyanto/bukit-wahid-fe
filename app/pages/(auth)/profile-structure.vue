<script setup lang="ts">
import { useOrgStructure } from '~/composables/useOrgStructure'
import type { TabsItem } from '@nuxt/ui'
import { useRtStructure } from '~/composables/structure/useRTOrg'
import { useRwStructure } from '~/composables/structure/useRwOrg'

definePageMeta({
  middleware: ['auth']
})

const {
  orgFormSchema,
  isOpen,
  mode,
  form,
  StructureItems,
  openAddModal,
  openEditModal,
  saveData,
  deleteNode
} = useOrgStructure()

const { selectedRT, rtData, addRT } = useRtStructure()
const { rwData, fetchRw } = useRwStructure()
const { dropdownRT, getDropdownRT } = useApiDropdown()

const tabs = [
  { label: 'RW', slot: 'rw' },
  { label: 'RT', slot: 'rt' }
] satisfies TabsItem[]

onMounted(() => {
  getDropdownRT()
  fetchRw()
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
          <!-- LEVEL -->
          <UFormField name="level" required class="w-full">
            <URadioGroup
              v-model="form.level"
              orientation="horizontal"
              variant="list"
              class="w-full"
              :items="StructureItems"
            />
          </UFormField>

          <!-- TITLE -->
          <UFormField name="title" label="Jabatan" required class="w-full">
            <UInput
              v-model="form.title"
              class="w-full"
              placeholder="Nama Jabatan"
            />
          </UFormField>

          <!-- NAME -->
          <UFormField name="name" label="Nama" required class="w-full">
            <UInput
              v-model="form.name"
              class="w-full"
              placeholder="Nama Lengkap"
            />
          </UFormField>

          <!-- ADDRESS -->
          <UFormField name="address" label="Alamat" required class="w-full">
            <UInput
              v-model="form.address"
              class="w-full"
              placeholder="Alamat Lengkap"
            />
          </UFormField>

          <div class="flex w-full items-center justify-between gap-2">
            <UButton
              v-if="mode === 'edit'"
              variant="subtle"
              @click="deleteNode"
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

    <!-- TABS (unchanged) -->
    <UTabs
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
        <div class="my-4 flex w-full justify-end gap-2">
          <UButton color="error" variant="outline" trailing-icon="mdi-download">
            Download
          </UButton>

          <UButton
            color="neutral"
            icon="mdi-plus-circle-outline"
            @click="openAddModal('rw')"
          >
            Tambah Struktur
          </UButton>
        </div>

        <div class="flex w-full justify-center">
          <div v-if="rwData">
            <OrgChart
              :datasource="rwData"
              @node-click="(node) => openEditModal('rw', node)"
            />
          </div>
          <div v-else class="loading">Memuat Struktur RW...</div>
        </div>
      </template>

      <template #rt>
        <div class="my-4 flex w-full justify-between gap-4">
          <USelectMenu
            v-model="selectedRT"
            placeholder="Pilih RT"
            create-item-label="Tambahkan RT"
            :search-input="{
              placeholder: 'Cari nama RT'
            }"
            :items="dropdownRT"
            value-key="key"
            label-key="lable"
            searchable
            create-item
            class="w-40"
            @create="addRT"
          />

          <div class="flex gap-2">
            <UButton
              color="error"
              variant="outline"
              trailing-icon="mdi-download"
            >
              Download
            </UButton>

            <UButton
              color="neutral"
              icon="mdi-plus-circle-outline"
              @click="openAddModal('rt')"
            >
              Tambah Struktur
            </UButton>
          </div>
        </div>

        <div class="flex w-full justify-center pt-8">
          <div v-if="selectedRT && rtData">
            <OrgChart
              :datasource="rtData"
              accent-color="success"
              @node-click="(node) => openEditModal('rt', node)"
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
