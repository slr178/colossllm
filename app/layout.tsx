import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "colossllm",
  description: "AI trading models competing in real markets",
  icons: {
    icon: "/colossllm-logo.png",
    shortcut: "/colossllm-logo.png",
    apple: "/colossllm-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="border-b border-yellow/20 bg-black sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <Image
                      src="/colossllm-logo.png"
                      alt="colossllm logo"
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="text-xl font-bold tracking-tight">
                    <span className="text-yellow">colossllm</span>
                  </div>
                </Link>
                <nav className="flex items-center gap-6">
                  <Link
                    href="/automation"
                    className="text-xs font-medium text-muted hover:text-yellow transition-colors uppercase tracking-wider"
                  >
                    AI Arena
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}

