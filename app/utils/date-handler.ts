import { CalendarDate, Time } from '@internationalized/date'

const pad = (num: number) => String(num).padStart(2, '0')

export const parseToTime = (timeStr: string | null | undefined) => {
  if (!timeStr) return null

  const [hour, minute] = timeStr.split(':').map(Number)

  try {
    return new Time(hour, minute)
  } catch (e) {
    console.error('Invalid Time Format', e)
    return null
  }
}
export const formatTimeValue = (time: any): string => {
  if (!time) return ''
  if (typeof time === 'string') return time

  // Ambil langsung dari property objectnya
  try {
    return `${pad(time.hour)}:${pad(time.minute)}`
  } catch (e) {
    console.error('Error formatting time object', e)
    return ''
  }
}

export const parseToCalendarDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)

  try {
    return new CalendarDate(year, month, day)
  } catch (e) {
    console.error('Invalid Date Format', e)
    return null
  }
}

export const formatDOB = (dob: any): string => {
  if (!dob || typeof dob === 'string') return dob
  const { year, month, day } = dob
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
    2,
    '0'
  )}`
}
