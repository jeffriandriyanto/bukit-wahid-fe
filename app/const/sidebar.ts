import type { SidebarItem } from '~/types/sidebar'

export const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/dashboard'
  },
  {
    label: 'Struktur Organisasi',
    icon: 'i-lucide-network',
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
        icon: 'i-lucide-contact-2',
        to: '/master-data/family'
      },
      {
        label: 'Data Rumah',
        icon: 'i-lucide-home',
        to: '/master-data/home'
      },
      {
        label: 'Petugas & Staf',
        icon: 'i-lucide-user-check',
        to: '/master-data/employee'
      }
    ]
  },
  {
    label: 'Keuangan',
    icon: 'i-lucide-banknote', // Menggambarkan aliran uang secara umum
    children: [
      {
        label: 'Kelola Master Tagihan',
        icon: 'i-lucide-hand-coins',
        to: '/bill/master'
      },
      {
        label: 'Laporan Tagihan',
        icon: 'i-lucide-file-text', // Laporan dokumen
        to: '/bill/report'
      },
      {
        label: 'Master COA',
        icon: 'i-lucide-tags',
        to: '/bill/coa'
      },
      {
        label: 'Petty Cash',
        icon: 'i-lucide-coins',
        to: '/bill/petty-cash'
      },
      {
        label: 'Jurnal',
        icon: 'i-lucide-notebook-tabs',
        to: '/bill/journal'
      },
      {
        label: 'Pembayaran Tagihan Air',
        icon: 'i-lucide-droplets',
        isHide: true,
        to: '/bill/pdam'
      }
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
      {
        label: 'Pengumuman',
        icon: 'i-lucide-announcement',
        to: '/announcement'
      }
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
      },
      {
        label: 'Surat',
        icon: 'i-lucide-mail',
        to: '/letter'
      },
    ]
  },
  {
    label: 'Galeri',
    icon: 'i-lucide-images',
    to: '/galleries'
  },
  {
    label: 'Pengaturan',
    icon: 'i-lucide-settings-2',
    to: '/settings'
  }
]
