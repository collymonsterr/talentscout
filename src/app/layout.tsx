import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ExpertScout — Find hidden experts by what they actually know",
  description:
    "Describe the expert you need. ExpertScout searches public Reddit discussions to find people who repeatedly demonstrate practical expertise.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider>
          <header className="border-b border-border">
            <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
              <Link href="/" className="text-base font-semibold tracking-tight">
                ExpertScout
              </Link>
              <nav className="flex items-center gap-6">
                <Link
                  href="/bench"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Bench
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
