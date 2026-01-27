<script setup lang="ts">
const { state, isOpen, confirm, cancel } = useConfirmService()
</script>

<template>
  <UModal v-model:open="isOpen" :close="false">
    <template #body>
      <span class="font-bold text-lg">
        {{ state.title }}
      </span>
      <p>{{ state.description }}</p>
    </template>

    <template #footer>
      <div class="flex justify-between w-full">
        <UButton variant="ghost" color="error" @click="cancel()">
          {{ state.cancelLabel }}
        </UButton>
        <UButton variant="solid" color="neutral" @click="confirm()">
          {{ state.confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
