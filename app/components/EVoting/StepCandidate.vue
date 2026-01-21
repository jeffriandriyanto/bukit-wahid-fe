<script setup lang="ts">
const props = defineProps<{ modelValue: any }>()

const handlePosterUpload = (index: number, files: any) => {
  if (!files || (Array.isArray(files) && files.length === 0)) return
  const file = Array.isArray(files) ? files[0] : files

  // Hapus blob lama memory management
  const currentPoster = props.modelValue.candidate[index].poster
  if (currentPoster?.startsWith('blob:')) URL.revokeObjectURL(currentPoster)

  props.modelValue.candidate[index].poster = URL.createObjectURL(file)
}
</script>

<template>
  <div class="space-y-4 pt-4">
    <div
      v-for="(c, index) in modelValue.candidate"
      :key="index"
      class="p-4 border rounded-xl bg-gray-50 space-y-3 relative"
    >
      <div class="flex justify-between items-center">
        <span class="text-sm font-bold text-gray-500"
          >Kandidat #{{ index + 1 }}</span
        >
        <UButton
          v-if="modelValue.candidate.length > 2"
          icon="i-lucide-trash"
          color="error"
          variant="ghost"
          size="xs"
          @click="modelValue.candidate.splice(index, 1)"
        />
      </div>

      <div class="grid grid-cols-12 gap-3">
        <UFormField
          class="col-span-12 md:col-span-4"
          :name="`candidate.${index}.name`"
          label="Nama Lengkap"
        >
          <UInput v-model="c.name" />
        </UFormField>
        <UFormField
          class="col-span-12 md:col-span-4"
          :name="`candidate.${index}.vision`"
          label="Visi/Misi"
        >
          <UInput v-model="c.vision" />
        </UFormField>
        <UFormField class="col-span-12 md:col-span-4" label="Poster">
          <UFileUpload
            accept="image/*"
            @update:model-value="(f) => handlePosterUpload(index, f)"
          >
            <template #default="{ open }">
              <UButton
                :color="c.poster ? 'success' : 'white'"
                label="Upload Poster"
                icon="i-lucide-image"
                @click="open"
              />
            </template>
          </UFileUpload>
        </UFormField>
        <img
          v-if="c.poster"
          class="col-span-12 object-cover aspect-video rounded-md border"
          :src="c.poster"
        />
      </div>
    </div>

    <UButton
      variant="ghost"
      block
      icon="i-lucide-plus"
      @click="modelValue.candidate.push({ name: '', vision: '', poster: '' })"
    >
      Tambah Kandidat
    </UButton>
  </div>
</template>
