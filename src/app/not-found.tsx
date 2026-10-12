import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">Halaman tidak ditemukan.</h1>
      <p className="mt-4 text-muted">Periksa alamat yang kamu buka atau buat link pendek baru.</p>
      <Link href="/" className="mt-8 inline-flex min-h-11 w-fit items-center rounded-lg bg-accent px-5 font-semibold text-white">Kembali ke beranda</Link>
    </main>
  );
}
