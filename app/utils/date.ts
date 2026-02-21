import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
const toDate = (date: string | Date): Date => {
  return typeof date === 'string' ? parseISO(date) : date
}

export function formatDate(date?: string | Date, formatStr = "dd MMMM yyyy") {
  if (!date) return "-"
  try {
    return format(toDate(date), formatStr, { locale: id })
  } catch (error) {
    console.error('Invalid date passed to formatDate:', error)
    return "-"
  }
}

export function formatDateTime(date?: string | Date) {
  return formatDate(date, "dd MMMM yyyy HH:mm")
}

export function formatTime(date?: string | Date) {
  return formatDate(date, "HH:mm")
}

export function formatYearMonth(date?: string | Date) {
  return formatDate(date, "MMMM yyyy")
}

export function getYear() {
  return formatDate(new Date(), "yyyy")
}
