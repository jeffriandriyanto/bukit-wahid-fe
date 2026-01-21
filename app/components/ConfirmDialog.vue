<script setup lang="ts">
import { useConfirmService } from '~/composables/useConfirmService'

const { state, isOpen, confirm, cancel } = useConfirmService()
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :close="false"
  >
    <template #body>
      <span class="font-bold text-lg">
        {{ state.title }}
      </span>
      <p>{{ state.description }}</p>
    </template>

    <template #footer>
      <div class="flex justify-between w-full">
        <UButton
          variant="ghost"
          color="error"
          @click="cancel()"
        >
          Batal
        </UButton>
        <UButton
          variant="solid"
          color="neutral"
          @click="confirm()"
        >
          Hapus
        </UButton>
      </div>
    </template>
  </UModal>
</template>
