<script setup lang="ts">
definePageMeta({
  layout: 'landingpage'
})
</script>

<template>
  <div>
    <!-- Hero Banner -->
    <section class="relative h-screen w-full overflow-hidden flex items-center">
      <div class="absolute inset-0 z-0">
        <img
          src="/images/landingpage.png"
          alt="Bukit Wahid Regency"
          class="w-full h-full object-cover"
        >
        <div
          class="absolute inset-0 bg-linear-to-r from-neutral-950 via-neutral-950/60 to-transparent"
        />
      </div>

      <UContainer class="relative z-10 w-full">
        <div class="max-w-2xl space-y-6 flex flex-col items-start">
          <div class="space-y-2">
            <h1
              class="text-4xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight text-balance"
            >
              RW 11 Bukit <br>
              <span class="text-primary-600"> Wahid </span>
              Regency
            </h1>
          </div>

          <div class="space-y-3 text-neutral-300 max-w-lg">
            <div class="flex gap-3 items-start">
              <UIcon name="i-lucide-map-pin" class="w-6 h-6 shrink-0" />
              <p class="text-sm md:text-base leading-relaxed">
                Kelurahan Manyaran, Kecamatan Semarang Barat, <br>
                Kota Semarang, Jawa Tengah.
              </p>
            </div>
            <div class="flex gap-3 items-start">
              <UIcon name="i-lucide-home" class="w-5 h-5 shrink-0" />
              <p class="text-xs md:text-sm">
                Sekretariat: Jungle Toon Bukit Wahid Regency, Manyaran
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-4 pt-4">
            <UButton
              to="https://wa.me/your-number"
              color="primary"
              variant="solid"
              icon="i-simple-icons-whatsapp"
              class="rounded-full px-8 hover:scale-105 transition-transform"
            >
              Hubungi Kami
            </UButton>
            <UButton
              to="mailto:admin@dailyjeds.com"
              icon="i-lucide-mail"
              class="bg-white text-black hover:bg-white/80 hover:scale-105 transition-transform rounded-full px-8"
            >
              Email
            </UButton>
          </div>
        </div>
      </UContainer>

      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <UIcon name="i-lucide-chevron-down" class="w-6 h-6 text-white/50" />
      </div>
    </section>

    <section>

    </section>
  </div>
</template>
