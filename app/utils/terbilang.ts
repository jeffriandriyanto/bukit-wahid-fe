function toWords(n: number): string {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas']
  n = Math.floor(Math.abs(n))

  if (n < 12) {
    return bilangan[n] || ''
  } else if (n < 20) {
    return `${toWords(n - 10)} Belas`
  } else if (n < 100) {
    return `${toWords(Math.floor(n / 10))} Puluh ${toWords(n % 10)}`
  } else if (n < 200) {
    return `Seratus ${toWords(n - 100)}`
  } else if (n < 1000) {
    return `${toWords(Math.floor(n / 100))} Ratus ${toWords(n % 100)}`
  } else if (n < 2000) {
    return `Seribu ${toWords(n - 1000)}`
  } else if (n < 1000000) {
    return `${toWords(Math.floor(n / 1000))} Ribu ${toWords(n % 1000)}`
  } else if (n < 1000000000) {
    return `${toWords(Math.floor(n / 1000000))} Juta ${toWords(n % 1000000)}`
  } else if (n < 1000000000000) {
    return `${toWords(Math.floor(n / 1000000000))} Miliar ${toWords(n % 1000000000)}`
  } else if (n < 1000000000000000) {
    return `${toWords(Math.floor(n / 1000000000000))} Triliun ${toWords(n % 1000000000000)}`
  }
  return ''
}

export function terbilang(val: number | string, suffix = 'Rupiah'): string {
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (isNaN(num) || num === 0) return `Nol ${suffix}`.trim()
  const words = toWords(num).replace(/\s+/g, ' ').trim()
  return suffix ? `${words} ${suffix}`.trim() : words
}
