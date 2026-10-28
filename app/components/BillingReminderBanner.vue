<script setup lang="ts">
import {
  BILLING_REMINDER_CONFIG,
  BILLING_REMINDER_ITEMS
} from '~/const/billing-reminder'

const { showBanner, closeBannerForSession, openPayUrl, snooze } =
  useBillingReminder()
</script>

<template>
  <UAlert
    v-if="showBanner"
    title="Pengingat layanan BWR"
    description="Server IDCloudHost & Domainesia belum dicek? Buka link, login, lalu top-up sebelum layanan mati."
    icon="i-lucide-bell-ring"
    color="warning"
    variant="soft"
    class="mb-4"
    :ui="{ root: 'ring-amber-200' }"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-2 mt-3">
        <UButton
          v-for="item in BILLING_REMINDER_ITEMS"
          :key="item.id"
          color="warning"
          variant="solid"
          size="xs"
          icon="i-lucide-external-link"
          @click="openPayUrl(item.payUrl)"
        >
          {{ item.ctaLabel }}
        </UButton>
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          @click="snooze()"
        >
          Sudah Bayar, Ingatkan {{ BILLING_REMINDER_CONFIG.intervalDays }} Hari Lagi
        </UButton>
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-lucide-x"
          aria-label="Tutup pengingat sesi ini"
          @click="closeBannerForSession()"
        />
      </div>
      <p class="text-[11px] opacity-70 mt-2">
        Pengingat muncul tiap {{ BILLING_REMINDER_CONFIG.intervalDays }} hari.
      </p>
    </template>
  </UAlert>
</template>
