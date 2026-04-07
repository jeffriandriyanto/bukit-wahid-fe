import type { SidebarItem } from '~/types/sidebar'

export const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/dashboard'
  },
  {
    label: 'Profil & Struktur',
    icon: 'i-lucide-network', // Menggambarkan struktur organisasi/hierarki
    to: '/profile-structure'
  },
  {
    label: 'Data Master',
    icon: 'i-lucide-database',
    children: [
      {
        label: 'Data Warga',
        icon: 'i-lucide-users',
        to: '/master-data/citizen'
      },
      {
        label: 'Data Keluarga',
        icon: 'i-lucide-contact-2', // Ikon kartu identitas/kontak grup
        to: '/master-data/family'
      },
      {
        label: 'Data Rumah',
        icon: 'i-lucide-home',
        to: '/master-data/home'
      },
    ]
  },
  {
    label: 'Keuangan',
    icon: 'i-lucide-wallet',
    children: [
      {
        label: 'Tagihan & Iuran',
        icon: 'i-lucide-hand-coins',
        to: '/bill/master'
      },
      {
        label: 'Laporan Tagihan',
        icon: 'i-lucide-file-bar-chart',
        to: '/bill/report'
      },
      {
        label: 'Master COA',
        icon: 'i-lucide-file-bar-chart',
        to: '/bill/coa'
      },
      {
        label: 'Pembayaran PDAM',
        icon: 'i-lucide-credit-card',
        isHide: true,
        to: '/bill/pdam'
      },
    ]
  },
  {
    label: 'Informasi & Agenda',
    icon: 'i-lucide-megaphone',
    children: [
      {
        label: 'Berita Warga',
        icon: 'i-lucide-newspaper',
        to: '/news'
      },
      {
        label: 'Agenda Pertemuan',
        icon: 'i-lucide-calendar-days',
        to: '/meeting-agenda'
      },
    ]
  },
  {
    label: 'Layanan Warga',
    icon: 'i-lucide-hand-helping',
    children: [
      {
        label: 'Pengaduan',
        icon: 'i-lucide-message-square-warning',
        to: '/citizen-complaints'
      },
      {
        label: 'E-Voting',
        icon: 'i-lucide-vote',
        to: '/e-voting'
      }
    ]
  },
  {
    label: 'Galeri',
    icon: 'i-lucide-images',
    to: '/galleries'
  },
  {
    label: 'Pengaturan',
    icon: 'i-lucide-cog',
    to: '/settings'
  },
]
