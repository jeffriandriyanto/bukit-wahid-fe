import { BILLING_REMINDER_CONFIG } from '~/const/billing-reminder'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export const getLastBillingSnoozedAt = (): number | null => {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(BILLING_REMINDER_CONFIG.storageKey)
    if (!raw) return null
    const ts = Number(raw)
    return Number.isFinite(ts) && ts > 0 ? ts : null
  } catch {
    return null
  }
}

export const shouldShowBillingReminder = (now: number = Date.now()): boolean => {
  if (!import.meta.client) return false
  const last = getLastBillingSnoozedAt()
  if (last === null) return true
  return now - last >= BILLING_REMINDER_CONFIG.intervalDays * MS_PER_DAY
}

export const useBillingReminder = () => {
  const showModal = useState<boolean>('billing-reminder-modal', () => false)
  const showBanner = useState<boolean>('billing-reminder-banner', () => false)
  const isBannerClosedThisSession = useState<boolean>(
    'billing-reminder-banner-closed',
    () => false
  )

  const snooze = (): void => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(
        BILLING_REMINDER_CONFIG.storageKey,
        String(Date.now())
      )
    } catch {
      // abaikan (mode private dsb), popup akan muncul lagi saat refresh
    }
    showModal.value = false
    showBanner.value = false
  }

  const closeModalForSession = (): void => {
    showModal.value = false
  }

  const closeBannerForSession = (): void => {
    isBannerClosedThisSession.value = true
    showBanner.value = false
  }

  const openPayUrl = (url: string): void => {
    if (!import.meta.client || !url) return
    window.open(url, '_blank', 'noopener')
  }

  const checkAndShow = (): void => {
    if (!import.meta.client) return
    if (!shouldShowBillingReminder()) {
      showModal.value = false
      showBanner.value = false
      return
    }
    showBanner.value = !isBannerClosedThisSession.value
    showModal.value = true
  }

  return {
    showModal,
    showBanner,
    checkAndShow,
    shouldShowBillingReminder,
    getLastBillingSnoozedAt,
    snooze,
    closeModalForSession,
    closeBannerForSession,
    openPayUrl
  }
}
