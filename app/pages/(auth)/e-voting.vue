<script setup lang="ts">
import { getPaginationRowModel } from '@tanstack/vue-table'
import { format } from 'date-fns'
import type { EVotingForm } from '~/utils/schemas/evoting'

definePageMeta({ middleware: ['auth'] })

const { reveal: confirm } = useConfirmService()

// STATE
const selectedRT = ref('RT 01')
const isOpen = ref(false)
const isOpenResult = ref(false) // State untuk membuka Modal Result
const rtItems = ['Semua RT', 'RT 01', 'RT 02', 'RT 03', 'RT 04']
const editingIndex = ref<number | null>(null)
const editingData = ref<EVotingForm | null>(null)
const dataResult = ref() // Menyimpan data baris yang diklik untuk result
const pagination = ref({ pageIndex: 0, pageSize: 5 })

// DATA DUMMY
const dataEVoting = ref([
  {
    title: 'Pemilihan Ketua Karang Taruna',
    shown: 'RT 02',
    date: '2026-03-10',
    time: '19:00',
    vote: 0,
    vote_yet: 150,
    image: '',
    candidate: [
      { name: 'Ahmad Dahlan', vision: 'Muda Berkaraya', poster: '' },
      { name: 'Budi Utomo', vision: 'Bersatu Kita Teguh', poster: '' }
    ]
  }
])

const dataEVotingDone = ref([
  {
    title: 'Pemilihan Ketua RW 05 (Selesai)',
    selected_candidate: 'Suprihadi',
    vote: 142,
    vote_yet: 10,
    date: '2025-12-01',
    time: '12:00',
    candidate: [
      { name: 'Suprihadi', votes: 60, vision: 'Maju', poster: '' },
      { name: 'Wibowo', votes: 45, vision: 'Jaya', poster: '' },
      { name: 'Suhartono', votes: 37, vision: 'Abadi', poster: '' }
    ]
  }
])

// TABLE COLUMNS
const eVotingTable = [
  { accessorKey: 'title', header: 'Judul Voting' },
  { accessorKey: 'shown', header: 'Target' },
  { accessorKey: 'date', header: 'Batas Waktu' },
  { accessorKey: 'action', header: 'Aksi' }
]

const eVotingDoneTable = [
  { accessorKey: 'title', header: 'Judul Voting' },
  { accessorKey: 'selected_candidate', header: 'Pemenang' },
  { accessorKey: 'vote', header: 'Total Suara' },
  { accessorKey: 'action', header: 'Lihat Hasil' }
]

// ACTIONS
const openAddModal = () => {
  editingData.value = null
  editingIndex.value = null
  isOpen.value = true
}

const openEditModal = (row: any) => {
  editingIndex.value = dataEVoting.value.indexOf(row)
  editingData.value = row
  isOpen.value = true
}

const handleSaveData = (formData: EVotingForm) => {
  const payload = {
    ...formData,
    vote: editingData.value ? (editingData.value as any).vote : 0,
    vote_yet: editingData.value ? (editingData.value as any).vote_yet : 0
  }

  if (editingIndex.value !== null) {
    dataEVoting.value[editingIndex.value] = payload as any
  } else {
    dataEVoting.value.unshift(payload as any)
  }
  isOpen.value = false
}

const confirmDelete = async (row: any) => {
  const ok = await confirm({
    title: 'Hapus Data?',
    description: `Hapus voting "${row.title}"?`,
    color: 'error'
  })
  if (ok) {
    const idx = dataEVoting.value.indexOf(row)
    dataEVoting.value.splice(idx, 1)
  }
}

// Logic Buka Result
const openResultModal = (row: any) => {
  dataResult.value = row
  isOpenResult.value = true
}
</script>

<template>
  <div>
    <ConfirmDialog />

    <div class="mb-6 flex justify-between items-center">
      <USelect v-model="selectedRT" :items="rtItems" class="w-48" />
      <UButton
        color="primary"
        icon="i-lucide-plus-circle"
        @click="openAddModal"
      >
        Tambah E-Voting
      </UButton>
    </div>

    <EVotingFormModal
      v-model:open="isOpen"
      :initial-data="editingData"
      @save="handleSaveData"
    />

    <EVotingResult v-model:open="isOpenResult" :data="dataResult" />

    <UTabs
      :items="[
        { label: 'Berjalan', slot: 'berjalan' },
        { label: 'Selesai', slot: 'selesai' }
      ]"
      variant="link"
      class="mb-6 w-full"
    >
      <template #berjalan>
        <UTable
          v-model:pagination="pagination"
          :data="dataEVoting"
          :columns="eVotingTable"
          :pagination-options="{
            getPaginationRowModel: getPaginationRowModel()
          }"
        >
          <template #date-cell="{ row }">
            <div>{{ format(new Date(row.original.date), 'dd MMM yyyy') }}</div>
            <div class="text-xs text-gray-400">{{ row.original.time }} WIB</div>
          </template>
          <template #action-cell="{ row }">
            <div class="flex gap-2">
              <UButton
                icon="i-lucide-pencil"
                variant="ghost"
                color="error"
                @click="openEditModal(row.original)"
              />
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                color="error"
                @click="confirmDelete(row.original)"
              />
            </div>
          </template>
        </UTable>
      </template>

      <template #selesai>
        <UTable
          v-model:pagination="pagination"
          :data="dataEVotingDone"
          :columns="eVotingDoneTable"
          :pagination-options="{
            getPaginationRowModel: getPaginationRowModel()
          }"
        >
          <template #action-cell="{ row }">
            <UButton
              icon="i-lucide-eye"
              variant="ghost"
              color="error"
              @click="openResultModal(row.original)"
            />
          </template>
        </UTable>
      </template>
    </UTabs>
  </div>
</template>
