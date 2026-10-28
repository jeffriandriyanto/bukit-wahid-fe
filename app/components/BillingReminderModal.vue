<script setup lang="ts">
import {
  BILLING_REMINDER_CONFIG,
  BILLING_REMINDER_ITEMS
} from '~/const/billing-reminder'

const { showModal, snooze, closeModalForSession, openPayUrl } =
  useBillingReminder()
</script>

<template>
  <UModal v-model:open="showModal" :ui="{ content: 'sm:max-w-lg' }">
    <template #header>
      <div class="flex items-start gap-3">
        <div class="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
          <UIcon name="i-lucide-bell-ring" class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-bold text-neutral-900">
            Pengingat Pembayaran Rutin
          </h3>
          <p class="text-xs text-neutral-500 mt-0.5">
            Muncul tiap {{ BILLING_REMINDER_CONFIG.intervalDays }} hari —
            masa aktif bisa habis sewaktu-waktu
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <p class="text-sm text-neutral-600">
        Halo Admin, jangan sampai layanan mati. Cek dan top-up layanan BWR
        secara berkala. Klik tombol di bawah untuk login lalu masukkan
        username/password seperti biasa.
      </p>

      <div class="space-y-3 mt-4">
        <div
          v-for="item in BILLING_REMINDER_ITEMS"
          :key="item.id"
          class="border border-neutral-200 rounded-2xl p-4 flex flex-col gap-2"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-bold text-neutral-900">
              {{ item.label }}
            </p>
            <span
              class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap"
            >
              {{ item.amountText }}
            </span>
          </div>
          <p class="text-xs text-neutral-500">
            {{ item.description }}
          </p>
          <p class="text-xs text-neutral-400 truncate">
            {{ item.payUrl }}
          </p>
          <UButton
            color="primary"
            variant="solid"
            size="sm"
            icon="i-lucide-external-link"
            class="self-start"
            @click="openPayUrl(item.payUrl)"
          >
            {{ item.ctaLabel }}
          </UButton>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-col sm:flex-row justify-end gap-2 w-full">
        <UButton
          color="neutral"
          variant="ghost"
          @click="closeModalForSession()"
        >
          Tutup
        </UButton>
        <UButton color="primary" variant="soft" @click="snooze()">
          Sudah Dibayar, Ingatkan {{ BILLING_REMINDER_CONFIG.intervalDays }} Hari Lagi
        </UButton>
      </div>
    </template>
  </UModal>
</template>
