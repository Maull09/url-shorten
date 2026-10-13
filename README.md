# Pendek

URL shortener untuk belajar full-stack dengan Next.js App Router, TypeScript, Tailwind CSS, Supabase Postgres, dan Supabase Auth.

Fitur: pemendekan link anonim, akun email/password dengan konfirmasi email, login/logout, dashboard pribadi, pembuatan dan penghapusan link milik pengguna, pagination, salin link, dan redirect publik. Custom alias, pemulihan password, dan statistik kunjungan belum termasuk.

Antarmuka tersedia dalam bahasa Indonesia (`/id`) dan Inggris (`/en`); `/` menuju `/id`. Gunakan pilihan ID/EN di header untuk berpindah bahasa. Terjemahan mencakup metadata, label aksesibilitas, form, clipboard, validasi, dan pesan API. Link pendek tetap memakai `/s/KODE` untuk kedua bahasa.

Font: Manrope untuk UI, Lora untuk judul utama, dan monospace sistem untuk URL. File font dan lisensi OFL disimpan lokal sehingga build dan pengunjung tidak perlu meminta font ke layanan eksternal.

## Menjalankan proyek

Gunakan Node.js 22 LTS atau lebih baru dan npm. Di PowerShell, gunakan `npm.cmd` jika eksekusi `npm.ps1` diblokir.

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
```

1. Buat atau buka proyek di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka SQL Editor dan jalankan migrasi secara berurutan: `supabase/migrations/202610130001_create_links.sql`, lalu `supabase/migrations/202610130002_add_link_ownership.sql`. Jika migrasi pertama sudah dijalankan untuk MVP sebelumnya, jalankan **hanya migrasi kedua**. Migrasi kedua mempertahankan link lama dengan owner null dan menambahkan policy akses per pengguna.
3. Ambil Project URL, secret key (`sb_secret_...`), dan publishable key (`sb_publishable_...`) dari pengaturan API Keys. Panduan resmi: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys). Jangan mengisi publishable key dengan secret key.
4. Isi `.env.local` secara lokal:

```dotenv
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_ISI_KEY_ASLI_DI_SINI
SUPABASE_PUBLISHABLE_KEY=sb_publishable_ISI_KEY_ASLI_DI_SINI
APP_URL=http://localhost:3007
```

Semua kredensial dipakai server dan tidak boleh dikirim lewat chat atau dimasukkan ke Git. Publishable key dipakai bersama JWT pengguna untuk Auth dan query dashboard dengan RLS. Secret key hanya untuk membuat link anonim dan mencari tujuan link publik. [Secret key melewati RLS](https://supabase.com/docs/guides/getting-started/api-keys), jadi dashboard tidak memakainya.

5. Di Supabase Authentication, aktifkan provider Email dan **Confirm email**. Atur minimum password setidaknya 8 karakter agar selaras dengan form.
6. Atur **Site URL** ke `http://localhost:3007`, lalu tambahkan redirect URLs `http://localhost:3007/id/auth/callback` dan `http://localhost:3007/en/auth/callback`. Gunakan template konfirmasi email bawaan Supabase agar PKCE mengembalikan `code` ke callback aplikasi. [Panduan password dan konfirmasi](https://supabase.com/docs/guides/auth/passwords).
7. Gunakan host dan port yang sama persis dengan `APP_URL` saat membuka browser. Jangan mencampur `localhost` dan `127.0.0.1`; cookie dan pemeriksaan origin membedakan keduanya. Untuk deploy, ganti semua URL ini ke origin HTTPS dan sesuaikan allowlist Supabase. HTTP hanya diizinkan untuk loopback lokal.

```powershell
npm.cmd run dev -- --port 3007
```

Buka `http://localhost:3007`. Login/registrasi ada di `/id/login` dan `/id/register`, dashboard di `/id/dashboard` (atau `/en/...`). Jika mengubah `.env.local`, restart dev server. Tampilan publik dan form akun dapat dibuka sebelum konfigurasi selesai, tetapi operasinya membutuhkan Supabase yang sudah terhubung. Tidak ada penyimpanan atau akun palsu sebagai pengganti layanan asli.

Konfirmasi email harus dibuka pada browser yang dipakai mendaftar karena kode PKCE disimpan dalam cookie HttpOnly. Jika konfirmasi gagal atau kedaluwarsa, coba masuk bila email sudah terverifikasi atau lakukan registrasi kembali. Layanan email bawaan Supabase memiliki batas pengujian; gunakan SMTP sendiri untuk pengguna di luar tim proyek. [Konfigurasi SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

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
- `src/lib/auth/`: konfigurasi origin, client SSR, verifikasi user, cookie, dan batas request akun.
- `src/proxy.ts`: refresh session dan penerusan cookie sebelum dashboard dirender.
- `src/app/api/auth/`: endpoint login, registrasi, dan logout.
- `src/app/[locale]/auth/callback/route.ts`: pertukaran kode PKCE dari konfirmasi email.
- `src/app/[locale]/dashboard/`: halaman yang memverifikasi session di server.
- `src/app/api/dashboard/` dan `src/lib/owned-links.ts`: data pribadi dengan JWT pengguna dan filter owner.
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

Tes memakai server HTTP lokal terisolasi untuk menguji batas REST/Auth Supabase, cookie, CSRF, pemalsuan identitas, dan akses antar-akun. Tes tidak mengakses proyek Supabase milikmu dan tidak membuktikan policy PostgreSQL yang belum dijalankan. Pengujian browser lokal memakai fixture terpisah dari kode produksi; Supabase asli, SMTP, dan migrasi harus diverifikasi setelah konfigurasi tersedia.

Untuk verifikasi integrasi asli: registrasi dan konfirmasi email, masuk, buat link di dashboard, restart aplikasi, lalu buka link yang sama. Coba dua akun: masing-masing hanya boleh melihat dan menghapus link miliknya. Link anonim lama harus tetap bisa dibuka dan tidak muncul di dashboard akun baru. Setelah menghapus link sendiri, `/s/KODE` harus mengembalikan 404. Logout harus membuat dashboard mengarahkan kembali ke login.

## Batas versi belajar

Link tujuan dapat diakses siapa pun yang mengetahui kode pendeknya. Hindari URL rahasia atau yang mengandung token. Link yang dibuat di beranda selalu anonim, termasuk saat akun sedang login. Gunakan dashboard untuk menyimpan link ke akun. Link anonim lama tidak dapat diklaim otomatis.

Berpindah bahasa membuka halaman baru; input dan hasil sementara tidak dipertahankan. Link dashboard tetap tersimpan di database. Pesan error pada `/s/KODE` mengikuti bahasa browser pengunjung, dengan bahasa Indonesia sebagai default.

Rate limit pembuatan link berlaku per IP per proses dan reset saat server restart. Sebelum membuka layanan publik, gunakan proxy dengan IP terpercaya, pembatasan bersama antar-instance, dan kebijakan penanganan link berbahaya. Deployment publik belum termasuk versi ini.

Audit pada setup awal 13 Oktober 2026: dependency produksi tidak memiliki temuan; audit lengkap memiliki lima temuan high pada rantai `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces` (advisory `GHSA-vfj7-8cjw-p6xm`). Temuan ini berada pada tooling development. Belum ada perbaikan otomatis; rekomendasi npm berupa downgrade major tidak diterapkan.

Latihan berikutnya: pemulihan password, custom alias beserta tes konflik, dan masa berlaku link.
