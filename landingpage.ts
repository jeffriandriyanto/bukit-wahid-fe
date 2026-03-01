/* eslint-disable @typescript-eslint/no-unused-vars */
import { reactive, ref } from 'vue'

// ------ Shared Types
type ISO8601Date = string // YYYY-MM-DD
type TimeString = string    // HH:mm

// ------ Interfaces sesuai API Contract (Laravel)

export interface GeneralInformation {
  hero_img: string
  hero_alt: string
  location: string
  secretariat: string
  whatsapp: string
  email: string
  logo: string
  welcome_image: string
  welcome_description: string // DB: text
  socials: {
    instagram: string
    x: string
    youtube: string
    facebook: string
  }
}

export interface Gallery {
  id?: number | string
  img: string
  alt: string
  description: string // DB: text
}

export interface Announcement {
  title: string
  slug: string // Unique
  image: string
  published_at: ISO8601Date
  author_name: string
}

export interface Agenda {
  title: string
  location: string
  description: string // DB: text
  start_date: ISO8601Date
  start_time: TimeString
  fors: Array<{ id: string; name: string }> // DB: json
}

export interface TransactionItem {
  id: string // UUID
  citizen_name: string
  amount: number // DB: decimal
  type: string
  status: 'Lunas' | 'Pending'
  payment_date: ISO8601Date | null
  period: string
  note: string
}

export interface Apparatus {
  name: string
  role: string
  photo: string
}

export interface WorkProgram {
  id?: number | string
  category: string
  work_program: string
  duration: string
  pic: string
  details: string[] // DB: json (array of strings)
}

export interface ProfileGeneral {
  kelurahan: string
  kecamatan: string
  kota: string
  boundaries: {
    Utara: string
    Selatan: string
    Timur: string
    Barat: string
  }
  area_size: string
  total_rt: string
}

export interface AgeGroup {
  label: string
  value: number
}

export interface ProfileDemographics {
  total_households: number
  total_residents: number
  age_groups: AgeGroup[]
}

export interface OrganizationMember {
  role: string
  name: string
}

export interface ProfileAssets {
  facilities: string[]
  routine_activities: string[]
}

// Main Interface for Profile
export interface ProfileData {
  general: ProfileGeneral
  demographics: ProfileDemographics
  organization: OrganizationMember[]
  assets_activities: ProfileAssets
  closing: string
}

// ----- State Management (Reactive Variables)

// 1. General Info & Hero (Single Object sesuai MD)
const information = ref<GeneralInformation>({
  hero_img: '',
  hero_alt: '',
  location: '',
  secretariat: '',
  whatsapp: '',
  email: '',
  logo: '',
  welcome_image: '',
  welcome_description: '',
  socials: {
    instagram: '',
    x: '',
    youtube: '',
    facebook: ''
  }
})

// 2. Arrays (CRUD/GET)
const galleries = ref<Gallery[]>([])
const announcements = ref<Announcement[]>([])
const agenda = ref<Agenda[]>([])
const transactions = ref<TransactionItem[]>([])
const apparatusMember = ref<Apparatus[]>([])
const programs = ref<WorkProgram[]>([])

// 3. Profile Data (Static/Master Data)
const profileData = reactive<ProfileData>({
  general: {
    kelurahan: 'Manyaran',
    kecamatan: 'Semarang Barat',
    kota: 'Semarang',
    boundaries: {
      Utara: 'RW 1 dan RW 2',
      Selatan: 'RW 6',
      Timur: 'RW 12',
      Barat: 'RW 5'
    },
    area_size: '± 178.000 m²',
    total_rt: '7 (RT 001 sampai RT 007)'
  },
  demographics: {
    total_households: 50,
    total_residents: 120,
    age_groups: [
      { label: 'Balita (0-4)', value: 14 },
      { label: 'Anak (5-12)', value: 29 },
      { label: 'Dewasa (18-59)', value: 28 },
      { label: 'Lansia (>60)', value: 3 }
    ]
  },
  organization: [
    { role: 'Pelindung', name: 'Lurah Manyaran Ibu Kanti' },
    { role: 'Penasihat', name: 'Majelis Musyawarah RW' },
    { role: 'Ketua RW', name: 'Sri Wihananto' },
    { role: 'Sekretaris', name: 'Berlia Adi Nata' },
    { role: 'Bendahara I', name: 'Fajar Pambudi' },
    { role: 'Bendahara II', name: 'Budi Chandra' }
  ],
  assets_activities: {
    facilities: [
      'Masjid',
      'Kolam Renang Jungle Toon',
      'Lapangan Bulu Tangkis',
      'Taman'
    ],
    routine_activities: [
      'Pengajian rutin',
      'Peringatan HUT RI',
      'Halal bihalal',
      'Acara Keagamaan'
    ]
  },
  closing: 'Demikian Profil RW 11 Bukit Wahid Regency, semoga bermanfaat bagi kita semua'
})
