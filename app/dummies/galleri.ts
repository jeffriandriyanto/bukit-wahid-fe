interface GalleryItem {
  id: string
  title: string
  event_date: string
  category: string
  description: string
  images: string[] // Array of URLs
}

export const galleries: GalleryItem[] = [
  {
    id: 'kegiatan-1',
    title: 'Pesta Rakyat & Lomba 17-an',
    event_date: '2025-08-17',
    category: 'Perayaan',
    description:
      'Kemeriahan warga Bukit Wahid dalam merayakan HUT RI ke-80 dengan berbagai lomba menarik.',
    images: [
      'https://picsum.photos/1200/800?random=1',
      'https://picsum.photos/1200/800?random=2',
      'https://picsum.photos/1200/800?random=3',
      'https://picsum.photos/1200/800?random=4',
      'https://picsum.photos/1200/800?random=5'
    ]
  },
  {
    id: 'kegiatan-2',
    title: 'Fogging Massal Blok B & C',
    event_date: '2026-01-10',
    category: 'Kesehatan',
    description:
      'Upaya preventif demam berdarah dengan melakukan fogging menyeluruh di area fasilitas umum.',
    images: [
      'https://picsum.photos/1200/800?random=6',
      'https://picsum.photos/1200/800?random=7',
      'https://picsum.photos/1200/800?random=8'
    ]
  }
]
