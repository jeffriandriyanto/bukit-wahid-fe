<script setup lang="ts">
const {
  CitizenFormSchema,
  PasswordSchema,
  columnsFamilyTable,
  ageGroupOptions,
  perPageLimit,
  genderItems,
  religionOptions,
  dropdownRT,
  isOpen,
  mode,
  loading,
  isOpenPassword,
  isFilterModalOpen,
  avatarFile,
  excelInput,
  loadingExcel,
  dataCitizen,
  pagination,
  search,
  tempRT,
  tempAgeGroup,
  tempReligion,
  activeFilterCount,
  form,
  passwordForm,
  getAge,
  clearFile,
  getData,
  openAddModal,
  openEditModal,
  saveData,
  confirmDelete,
  openPasswordModal,
  handleUpdatePassword,
  applyFilters,
  resetFilters,
  excelActions,
  handleExcelChange
} = useCitizen()
</script>

<template>
  <div class="space-y-4">
    <ConfirmDialog />

    <input
      ref="excelInput"
      type="file"
      accept=".xlsx, .xls"
      class="hidden"
      @change="handleExcelChange"
    />

    <SharedHeaderBg>
      <div
        class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full py-2"
      >
        <!-- Judul -->
        <div class="flex items-center gap-3 shrink-0">
          <div class="p-2 bg-primary-50 rounded-lg">
            <UIcon
              name="i-lucide-users-round"
              class="w-5 h-5 text-primary-600"
            />
          </div>
          <h2 class="text-lg font-bold text-gray-900 whitespace-nowrap">
            Manajemen Data Warga
          </h2>
        </div>

        <!-- Search & Filter Area -->
        <div class="flex flex-1 items-center gap-2 min-w-0 max-w-2xl">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Cari nama atau NIK..."
            size="md"
            class="flex-1 max-w-sm"
            :ui="{ root: 'rounded-full' }"
          />

          <UButton
            color="neutral"
            variant="soft"
            size="md"
            class="rounded-full shrink-0 font-semibold"
            @click="isFilterModalOpen = true"
          >
            <template #leading>
              <UIcon name="i-lucide-filter" class="w-4 h-4" />
            </template>
            <span class="hidden sm:inline">Filter</span>
            <UBadge
              v-if="activeFilterCount > 0"
              color="primary"
              size="xs"
              class="ml-1 rounded-full px-1.5"
            >
              {{ activeFilterCount }}
            </UBadge>
          </UButton>
        </div>

        <!-- Actions Area -->
        <div class="flex items-center gap-2 shrink-0">
          <UDropdownMenu
            :items="excelActions"
            :content="{ align: 'end', sideOffset: 8 }"
          >
            <UButton
              color="neutral"
              variant="subtle"
              size="md"
              class="rounded-full"
              :loading="loadingExcel"
            >
              <template #leading>
                <UIcon name="i-lucide-layers" class="w-4 h-4" />
              </template>
              <span class="hidden xl:inline">Opsi Data</span>
              <UIcon name="i-lucide-chevron-down" class="w-3.5 h-3.5 ml-0.5" />
            </UButton>
          </UDropdownMenu>

          <div class="h-6 w-px bg-neutral-200 mx-1 hidden sm:block"></div>

          <UButton
            color="primary"
            icon="i-lucide-plus"
            size="md"
            class="rounded-full px-5 shadow-sm font-bold"
            @click="openAddModal"
          >
            <span class="hidden sm:inline">Tambah Warga</span>
          </UButton>
        </div>
      </div>
    </SharedHeaderBg>

    <!-- Filter Modal -->
    <UModal
      v-model:open="isFilterModalOpen"
      :ui="{ content: 'max-w-md rounded-4xl' }"
    >
      <template #header>
        <div
          class="flex items-center gap-2 font-black text-neutral-900 uppercase tracking-tight"
        >
          <UIcon name="i-lucide-sliders-horizontal" class="text-primary-600" />
          Filter Pencarian
        </div>
      </template>

      <template #body>
        <div class="space-y-6">
          <UFormField label="Berdasarkan Wilayah RT">
            <USelectMenu
              v-model="tempRT"
              :items="dropdownRT"
              value-key="key"
              label-key="label"
              placeholder="Semua RT"
              size="xl"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Berdasarkan Kelompok Usia">
            <USelectMenu
              v-model="tempAgeGroup"
              :items="ageGroupOptions"
              value-key="key"
              label-key="label"
              placeholder="Semua Usia"
              size="xl"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Berdasarkan Agama">
            <USelectMenu
              v-model="tempReligion"
              :items="religionOptions"
              value-key="key"
              label-key="label"
              placeholder="Semua Agama"
              size="xl"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-between w-full">
          <UButton
            label="Reset Filter"
            color="error"
            variant="ghost"
            class="font-bold"
            @click="resetFilters"
          />
          <UButton
            label="Terapkan"
            color="primary"
            class="rounded-xl px-8 font-black uppercase tracking-widest"
            @click="applyFilters"
          />
        </div>
      </template>
    </UModal>

    <!-- Table -->
    <div
      class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <UTable
        :data="dataCitizen"
        :columns="columnsFamilyTable"
        :loading="loading"
      >
        <template #name-cell="{ row }">
          <div class="flex items-center gap-3 py-1">
            <UAvatar
              :src="row.original.avatar"
              :alt="row.original.name"
              size="md"
              class="bg-gray-100"
            />
            <div class="flex flex-col">
              <span class="font-bold text-gray-900 leading-tight">{{
                row.original.name
              }}</span>
              <span class="text-xs text-gray-500"
                >{{ getAge(row.original.dob) }} Tahun</span
              >
            </div>
          </div>
        </template>

        <template #ttl-cell="{ row }">
          <div class="flex flex-col text-sm">
            <span class="text-gray-700 font-medium">{{
              row.original.pob || '-'
            }}</span>
            <span class="text-xs text-gray-400">
              {{
                row.original.dob
                  ? new Date(row.original.dob).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  : '-'
              }}
            </span>
          </div>
        </template>

        <template #gender-cell="{ row }">
          <UBadge
            v-if="row.original.gender"
            :color="row.original.gender === 'L' ? 'primary' : 'secondary'"
            variant="soft"
            size="sm"
            class="font-bold"
          >
            {{ row.original.gender === 'L' ? 'Laki-laki' : 'Perempuan' }}
          </UBadge>
          <span v-else>-</span>
        </template>

        <template #blood_type-cell="{ row }">
          <div>{{ row.original.blood_type || '-' }}</div>
        </template>

        <template #type-cell="{ row }">
          <div
            class="flex items-center gap-1.5 capitalize text-xs font-medium text-gray-600"
          >
            <div class="w-1.5 h-1.5 rounded-full bg-green-500" />
            {{ row.original.type }}
          </div>
        </template>

        <template #action-cell="{ row }">
          <div class="flex gap-1">
            <UTooltip text="Ganti Password">
              <UButton
                icon="i-lucide-key-round"
                variant="ghost"
                color="warning"
                size="sm"
                @click="openPasswordModal(row.original.id)"
              />
            </UTooltip>

            <UTooltip text="Edit Data">
              <UButton
                icon="i-lucide-pencil"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="openEditModal(row.original)"
              />
            </UTooltip>
            <UTooltip text="Hapus Data">
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                color="error"
                size="sm"
                @click="confirmDelete(row.original.id)"
              />
            </UTooltip>
          </div>
        </template>
      </UTable>
    </div>

    <!-- Password Modal -->
    <UModal v-model:open="isOpenPassword" :ui="{ content: 'max-w-md' }">
      <template #header>
        <div class="flex items-center gap-2 font-bold text-gray-900">
          <UIcon name="i-lucide-shield-check" class="text-warning-500" />
          <span>Ubah Password Akun</span>
        </div>
      </template>

      <template #body>
        <UForm
          :schema="PasswordSchema"
          :state="passwordForm"
          class="space-y-4"
          @submit="handleUpdatePassword"
        >
          <UFormField
            name="password"
            label="Password Baru"
            help="Pastikan Anda memberitahu warga setelah mengganti password mereka."
          >
            <UInput
              v-model="passwordForm.password"
              type="password"
              placeholder="Masukkan password baru..."
              icon="i-lucide-lock"
              size="lg"
            />
          </UFormField>

          <div class="flex justify-end gap-3 pt-4">
            <UButton
              variant="ghost"
              label="Batal"
              @click="isOpenPassword = false"
            />
            <UButton
              type="submit"
              color="warning"
              label="Update Password"
              :loading="loading"
            />
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Form Modal -->
    <UModal v-model:open="isOpen" :ui="{ content: 'min-w-4xl' }">
      <template #header>
        <span class="font-bold"
          >{{ mode === 'add' ? 'Tambah' : 'Edit' }} Data Warga</span
        >
      </template>

      <template #body>
        <UForm
          :schema="CitizenFormSchema"
          :state="form"
          class="space-y-6"
          @submit="saveData"
        >
          <div class="grid grid-cols-2 gap-4">
            <UFormField name="nik" label="NIK">
              <UInput v-model="form.nik" placeholder="32xxxxxxxxxxxx" />
            </UFormField>
            <UFormField name="no_kk" label="Nomor KK">
              <UInput v-model="form.no_kk" placeholder="32xxxxxxxxxxxx" />
            </UFormField>
            <UFormField name="name" label="Nama Lengkap" required>
              <UInput v-model="form.name" />
            </UFormField>
            <UFormField name="email" label="Email">
              <UInput v-model="form.email" type="email" />
            </UFormField>
            <UFormField name="phone" label="No. Telepon">
              <UInput v-model="form.phone" />
            </UFormField>
            <UFormField name="gender" label="Jenis Kelamin">
              <USelect
                v-model="form.gender"
                :items="genderItems"
                value-key="key"
              />
            </UFormField>
            <UFormField name="pob" label="Tempat Lahir">
              <UInput v-model="form.pob" />
            </UFormField>
            <UFormField name="dob" label="Tanggal Lahir">
              <UInputDate v-model="form.dob" />
            </UFormField>
            <UFormField name="blood_type" label="Golongan Darah">
              <UInput v-model="form.blood_type" />
            </UFormField>
            <UFormField name="job" label="Pekerjaan">
              <UInput v-model="form.job" />
            </UFormField>

            <UFormField name="avatar" label="Foto Profil (Avatar)">
              <div v-if="form.avatar" class="relative w-32 h-32 mb-2">
                <img
                  :src="form.avatar"
                  class="w-full h-full object-cover rounded-lg border"
                />
                <UButton
                  size="xs"
                  color="error"
                  icon="i-lucide-x"
                  class="absolute -top-2 -right-2"
                  @click="clearFile('avatar')"
                />
              </div>
              <UFileUpload v-else v-model="avatarFile" accept="image/*" />
            </UFormField>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t">
            <UButton variant="ghost" label="Batal" @click="isOpen = false" />
            <UButton
              type="submit"
              color="neutral"
              label="Simpan Data"
              :loading="loading"
            />
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Pagination -->
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
  </div>
</template>
