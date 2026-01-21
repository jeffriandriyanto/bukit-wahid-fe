<script setup lang="ts">
  import { id } from '@nuxt/ui/locale'
  const locale = id
</script>

<template>
  <NuxtLayout>
    <UApp :locale="locale">
      <NuxtPage />
    </UApp>
  </NuxtLayout>
</template>
