import type { SidebarItem } from '~/types/sidebar'

export const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/dashboard'
  },
  {
    label: 'Profil & Struktur',
    icon: 'i-lucide-users-round',
    to: '/profile-structure'
  },
  {
    label: 'Master Data Warga',
    icon: 'fa7-solid:people-roof',
    to: '/master-data-citizen'
  },
  {
    label: 'Master Data',
    icon: 'i-lucide-database',
    to: '/master-data'
  },
  // {
  //   label: 'Daftar Pengajuan',
  //   icon: 'solar:document-add-broken',
  //   to: '/submission'
  // },
  {
    label: 'Berita',
    icon: 'i-lucide-megaphone',
    to: '/news'
  },
  {
    label: 'Agenda Pertemuan',
    icon: 'i-lucide-calendar-days',
    to: '/meeting-agenda'
  },
  {
    label: 'Pembayaran Online',
    icon: 'i-lucide-credit-card',
    to: '/online-payment'
  },
  {
    label: 'Laporan Keuangan',
    icon: 'i-lucide-banknote',
    to: '/financial-statements'
  },
  {
    label: 'Pengaduan Warga',
    icon: 'i-lucide-message-square-warning',
    to: '/citizen-complaints'
  },
  // {
  //   label: 'Panic Button',
  //   icon: 'i-lucide:triangle-alert',
  //   to: '/panic-button'
  // },

  {
    label: 'E-Voting',
    icon: 'i-lucide-vote',
    to: '/e-voting'
  }
]
