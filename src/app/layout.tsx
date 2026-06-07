import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EchoRank — AI Search Visibility & GEO Engine",
  description:
    "See whether ChatGPT, Claude, Perplexity and Google AI Overviews cite your brand — then auto-generate the content that closes the gap.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg)]/70 backdrop-blur-md">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-sm text-white">
                ◎
              </span>
              EchoRank
            </Link>
            <a
              href="https://github.com"
              className="text-sm text-[var(--muted)] hover:text-[var(--text)]"
            >
              GEO Engine
            </a>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
          EchoRank — Generative Engine Optimization. Audit · Diagnose · Generate · Track.
        </footer>
      </body>
    </html>
  );
}
