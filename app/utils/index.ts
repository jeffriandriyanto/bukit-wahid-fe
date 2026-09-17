export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!
}

export const formatCurrency = (val: string | number) => {
  const num = typeof val === 'string' ? parseFloat(val) : val
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num)
}

export const formatCurrencyCompact = (val: string | number) => {
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (num >= 1_000_000_000) {
    return `Rp${(num / 1_000_000_000).toFixed(1).replace('.', ',')} M`
  }
  if (num >= 1_000_000) {
    return `Rp${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1).replace('.', ',')} Jt`
  }
  return formatCurrency(val)
}
