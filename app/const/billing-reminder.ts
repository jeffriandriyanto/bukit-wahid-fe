export interface BillingReminderItem {
  id: string
  label: string
  amountText: string
  description: string
  payUrl: string
  ctaLabel: string
}

export const BILLING_REMINDER_CONFIG = {
  intervalDays: 3,
  storageKey: 'bwr-billing-reminder-last-snoozed'
} as const

export const BILLING_REMINDER_ITEMS: BillingReminderItem[] = [
  {
    id: 'server-idcloud',
    label: 'Server BWR — IDCloudHost',
    amountText: 'Rp 87.000 / bulan',
    description:
      'Top-up seperti token listrik. Nominal 87rb untuk 1 bulan, lebih juga boleh.',
    payUrl: 'https://console.idcloudhost.com/app/',
    ctaLabel: 'Buka Konsol IDCloudHost'
  },
  {
    id: 'wa-blast-domainesia',
    label: 'WA Blast — Domainesia',
    amountText: 'Cek tagihan di dashboard',
    description:
      'Wajib tiap bulan bersama server. Buka link, login, lalu cek & bayar tagihan berjalan.',
    payUrl: 'https://my.domainesia.com/signin',
    ctaLabel: 'Buka My Domainesia'
  }
]
