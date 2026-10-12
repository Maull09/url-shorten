import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pendek — URL Shortener",
  description: "Ubah URL panjang menjadi link singkat yang mudah disalin dan dibagikan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body className="font-sans antialiased">{children}</body></html>;
}
