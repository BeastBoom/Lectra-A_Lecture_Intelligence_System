import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ConditionalShell } from "@/components/layout/ConditionalShell";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lectra — AI Lecture Intelligence",
  description: "Transform your lectures into structured knowledge with AI-powered transcription, summarization, and study tools.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          {/* ConditionalShell renders bare for /landing and /login, AppShell for everything else */}
          <ConditionalShell>{children}</ConditionalShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
