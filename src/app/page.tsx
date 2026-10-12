import Link from "next/link";
import { LinkIcon } from "@/components/link-icon";
import { ShortenerForm } from "@/components/shortener-form";

const steps = [
  { title: "Tempel URL", description: "Salin alamat halaman yang ingin kamu bagikan." },
  { title: "Buat link pendek", description: "Kami menyimpan tujuan dan membuat kode unik untuk linkmu." },
  { title: "Salin dan bagikan", description: "Siapa pun yang membuka link akan diarahkan ke halaman tujuan." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <a href="#konten" className="sr-only z-10 rounded-lg bg-white p-3 focus:not-sr-only focus:absolute focus:top-3">Lewati ke konten</a>
      <header className="flex min-h-24 items-center justify-between gap-4 border-b border-line">
        <Link href="/" aria-label="Pendek, beranda" className="flex min-h-11 items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white"><LinkIcon className="h-5 w-5" /></span>
          <span className="font-display text-2xl font-bold tracking-tight">pendek.</span>
        </Link>
        <a href="#cara-kerja" className="inline-flex min-h-11 items-center text-sm font-semibold text-muted underline-offset-4 hover:text-accent hover:underline">Cara kerja</a>
      </header>

      <main id="konten">
        <section className="grid items-start gap-12 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24" aria-labelledby="hero-heading">
          <div className="min-w-0">
            <h1 id="hero-heading" className="font-display text-[clamp(2.75rem,6vw,4.5rem)] leading-[1.04] font-bold tracking-[-0.055em]">Link panjang.<br />Jadi singkat.</h1>
            <p className="mt-6 max-w-sm text-lg leading-relaxed text-muted">Ubah URL panjang menjadi link ringkas yang mudah disalin, dikirim, dan dibagikan.</p>
            <div className="mt-10 hidden max-w-md lg:block" aria-label="Ilustrasi URL panjang menjadi link pendek">
              <div className="rounded-lg border border-line bg-white px-4 py-3">
                <span className="text-xs font-semibold text-muted">Sebelum</span>
                <p className="mt-1 truncate font-mono text-sm text-muted">contoh.com/artikel/belajar-fullstack?ref=bagikan</p>
              </div>
              <div className="flex h-9 items-center pl-5 text-accent" aria-hidden="true">↓</div>
              <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <LinkIcon />
                <div className="min-w-0"><span className="text-xs font-semibold text-muted">Sesudah · ilustrasi</span><p className="mt-1 font-mono text-base font-semibold text-ink">/s/Ab3k9X2m</p></div>
              </div>
            </div>
          </div>
          <ShortenerForm />
        </section>

        <section id="cara-kerja" className="scroll-mt-8 border-t border-line py-10 sm:py-12" aria-labelledby="steps-heading">
          <h2 id="steps-heading" className="text-2xl font-semibold tracking-tight">Dari URL ke link pendek.</h2>
          <ol className="mt-8 grid gap-7 sm:grid-cols-3 sm:gap-9">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-sm font-semibold text-muted" aria-hidden="true">{index + 1}</span>
                <div><h3 className="font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p></div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-6 text-sm text-muted">
        <p>pendek. <span className="ml-2">Lebih ringkas, lebih mudah dibagikan.</span></p>
        <p>Bagikan hanya URL yang boleh diakses publik.</p>
      </footer>
    </div>
  );
}
