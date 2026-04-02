<template>
  <section
    class="relative py-12 bg-white border-b border-neutral-100 overflow-hidden"
  >
    <div
      class="absolute inset-0 z-0 opacity-[0.03]"
      style="
        background-image: radial-gradient(
          var(--color-neutral-400) 1px,
          transparent 1px
        );
        background-size: 24px 24px;
      "
    ></div>

    <UContainer class="relative z-10">
      <div
        class="max-w-4xl mx-auto flex flex-col items-center text-center space-y-6 animate-fade-in-up"
      >
        <div v-if="badge" class="flex justify-center">
          <div
            class="px-4 py-1.5 rounded-full bg-secondary-50 border border-secondary-100 shadow-sm"
          >
            <span
              class="text-[10px] uppercase tracking-[0.2em] font-extrabold text-secondary-600"
            >
              {{ badge }}
            </span>
          </div>
        </div>

        <div class="space-y-2">
          <h1
            class="text-4xl md:text-6xl font-extrabold text-neutral-900 tracking-tight leading-[1.1]"
          >
            {{ title }}
            <span v-if="highlight" class="text-primary-600">
              {{ highlight }}
            </span>
          </h1>
        </div>

        <div class="flex items-center gap-2">
          <div class="w-12 h-[2px] bg-primary-500 rounded-full"></div>
          <div class="w-2 h-2 rounded-full bg-secondary-500"></div>
          <div class="w-12 h-[2px] bg-neutral-200 rounded-full"></div>
        </div>

        <p
          class="text-neutral-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium"
        >
          {{ subtitle }}
        </p>
      </div>
    </UContainer>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  highlight?: string
  subtitle: string
  badge?: string
}>()
</script>
