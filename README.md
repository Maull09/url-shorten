# Pendek

URL shortener untuk belajar full-stack dengan Next.js App Router, TypeScript, Tailwind CSS, dan Supabase Postgres.

Fitur awal: membuat link pendek, menyimpan tujuan di database, menyalin link, menampilkan link yang dibuat selama halaman terbuka, dan redirect. Belum ada akun pengguna, custom alias, atau statistik kunjungan.

Antarmuka tersedia dalam bahasa Indonesia (`/id`) dan Inggris (`/en`); `/` menuju `/id`. Gunakan pilihan ID/EN di header untuk berpindah bahasa. Terjemahan mencakup metadata, label aksesibilitas, form, clipboard, validasi, dan pesan API. Link pendek tetap memakai `/s/KODE` untuk kedua bahasa.

Font: Manrope untuk UI, Lora untuk judul utama, dan monospace sistem untuk URL. File font dan lisensi OFL disimpan lokal sehingga build dan pengunjung tidak perlu meminta font ke layanan eksternal.

## Menjalankan proyek

Gunakan Node.js 22 LTS atau lebih baru dan npm. Di PowerShell, gunakan `npm.cmd` jika eksekusi `npm.ps1` diblokir.

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
```

1. Buat atau buka proyek di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka SQL Editor, salin isi `supabase/migrations/202610130001_create_links.sql`, lalu jalankan sekali. Ini membuat tabel `links`, constraint, dan aturan akses. Gunakan proyek belajar yang belum memiliki tabel bernama `links`.
3. Ambil Project URL dan secret key (`sb_secret_...`) dari pengaturan API Keys. Panduan resmi: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).
4. Isi `.env.local` secara lokal:

```dotenv
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_ISI_KEY_ASLI_DI_SINI
```

Secret key hanya dipakai server dan tidak boleh dikirim lewat chat atau dimasukkan ke Git. Aplikasi ini tidak memerlukan publishable key karena browser mengakses API Next.js, bukan Supabase langsung. [Secret key melewati RLS](https://supabase.com/docs/guides/getting-started/api-keys), jadi validasi harus tetap dilakukan di server.

```powershell
npm.cmd run dev
```

Buka `http://localhost:3000`. Jika mengubah `.env.local`, restart dev server. Tampilan dapat dibuka sebelum konfigurasi Supabase selesai, tetapi pembuatan dan pembukaan link membutuhkan database yang sudah terhubung. Tidak ada penyimpanan palsu sebagai pengganti database.

## Alur untuk dipelajari

```text
Form React
  → POST /api/links
  → validasi dan kode acak
  → INSERT ke Supabase
  → tampilkan dan salin /s/KODE

GET /s/KODE
  → SELECT tujuan di Supabase
  → redirect HTTP 302
```

- `src/components/shortener-form.tsx`: state form, fetch, loading, error, dan clipboard.
- `src/i18n/messages/id.json` dan `en.json`: kamus terjemahan dengan struktur yang sama; `src/i18n/config.ts` mengatur locale dan pilihan bahasa request.
- `src/app/[locale]/`: layout dengan bahasa dokumen, metadata, dan halaman lokal; `src/assets/fonts.ts` memuat font.
- `src/app/api/links/route.ts`: batas request dan respons HTTP.
- `src/lib/url.ts`: aturan URL dan kode pendek.
- `src/lib/links.ts`: penyimpanan dan penanganan collision kode.
- `src/lib/supabase.ts`: konfigurasi server dan client Supabase.
- `src/app/s/[code]/route.ts`: pencarian tujuan dan redirect.
- `supabase/migrations/202610130001_create_links.sql`: primary key, constraint, RLS, dan hak akses.

Arsitektur dan batas operasional: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Aturan visual: [DESIGN.md](DESIGN.md).

## Verifikasi

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd audit --omit=dev
```

Tes memakai server HTTP lokal terisolasi untuk menguji batas REST Supabase. Tes tidak mengakses proyek Supabase milikmu. Untuk verifikasi integrasi asli: buat link, buka hasilnya, restart aplikasi dan buka link yang sama lagi. Pastikan baris tersimpan di tabel `links`. URL tidak valid harus ditolak; kode tidak dikenal harus menghasilkan 404.

## Batas versi belajar

Link tujuan dapat diakses siapa pun yang mengetahui kode pendeknya. Hindari URL rahasia atau yang mengandung token. Link pada halaman hanya mencakup sesi halaman saat ini; database tetap menyimpan link setelah halaman ditutup.

Berpindah bahasa membuka halaman baru; input dan daftar link selama sesi halaman tidak dipertahankan. Pesan error pada `/s/KODE` mengikuti bahasa browser pengunjung, dengan bahasa Indonesia sebagai default.

Rate limit pembuatan link berlaku per IP per proses dan reset saat server restart. Sebelum membuka layanan publik, gunakan proxy dengan IP terpercaya, pembatasan bersama antar-instance, dan kebijakan penanganan link berbahaya. Deployment publik belum termasuk versi ini.

Audit pada setup awal 13 Oktober 2026: dependency produksi tidak memiliki temuan; audit lengkap memiliki lima temuan high pada rantai `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces` (advisory `GHSA-vfj7-8cjw-p6xm`). Temuan ini berada pada tooling development. Belum ada perbaikan otomatis; rekomendasi npm berupa downgrade major tidak diterapkan.

Latihan berikutnya: custom alias beserta tes konflik, masa berlaku link, lalu akun pengguna dan ownership dengan Supabase Auth/RLS.
