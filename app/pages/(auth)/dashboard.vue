<script setup lang="ts">
import { sub } from 'date-fns'

definePageMeta({
  middleware: ['auth']
})

const range = shallowRef({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})
const period = ref('daily')
</script>

<template>
  <div class="flex flex-col gap-4">
    <HomeStats :period="period" :range="range" />
    <HomeChart :period="period" :range="range" />
    <HomeSales :period="period" :range="range" />
  </div>
</template>
