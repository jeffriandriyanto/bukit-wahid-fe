# Bukit Wahid Regency - Frontend Portal

Sistem manajemen digital untuk warga RW 11 Bukit Wahid Regency. Aplikasi ini menangani berbagai modul seperti manajemen berita (announcements), e-voting, penagihan iuran, dan koordinasi acara warga.

## 🛠 Tech Stack

- **Framework:** [Nuxt 4](https://nuxt.com/) (v4.1.3+)
- **UI Library:** [Nuxt UI v4](https://ui.nuxt.com/) (Pro Edition features)
- **State Management:** [Pinia](https://pinia.vuejs.org/)
- **Utility:** VueUse, Date-fns, Zod (Validation)
- **Charts:** Apache ECharts & Nuxt ECharts
- **Package Manager:** [pnpm 10+](https://pnpm.io/)

## 🚀 Persiapan Pengembangan

Pastikan Anda menggunakan Node.js versi **20.x (LTS)** atau **22.x**.

### 1. Instalasi Dependensi

Proyek ini menggunakan konfigurasi `node-linker=hoisted` untuk menjaga stabilitas builder Nuxt 4 terhadap sistem symlink pnpm 10.

```bash
pnpm install
