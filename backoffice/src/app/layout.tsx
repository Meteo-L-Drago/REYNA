import type { Metadata } from "next";
import { Geist, Geist_Mono, Great_Vibes } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const reynaScript = Great_Vibes({
  variable: "--font-reyna-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "REYNA Backoffice – Lieferanten",
  description: "Zahlen, Rechnungen, Umsätze und Verkäufe verwalten",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${geistMono.variable} ${reynaScript.variable} antialiased bg-stone-50`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
