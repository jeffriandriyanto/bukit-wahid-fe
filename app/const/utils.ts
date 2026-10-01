export const perPageLimit = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: 'Semua', value: 9999 }
]

export const categories = [
  { label: 'Sosial', value: 'sosial' },
  { label: 'Keagamaan', value: 'keagamaan' },
  { label: 'Olahraga', value: 'olahraga' },
  { label: 'Pembangunan', value: 'pembangunan' },
  { label: 'Rapat Warga', value: 'rapat' }
]

const categoryLabelMap: Record<string, string> = {
  DUES: 'Iuran RW',
  PAM: 'Artetis',
  IPL: 'IPL',
  OTHER: 'Lainnya'
}

export const mapCategoryLabel = (category: string): string => {
  if (!category) return '-'
  return categoryLabelMap[category.toUpperCase()] || category
}
