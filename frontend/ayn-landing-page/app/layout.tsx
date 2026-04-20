/* eslint-disable react-refresh/only-export-components */
import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Noto_Sans_Arabic, Sora, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { UiLanguageProvider } from "@/lib/ui-language-context"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
})
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
})

const siteDescription =
  "Powered by Horus Engine for ISO 21001 & NAQAAE Standards. The comprehensive platform for educational quality assurance and compliance excellence."
const siteTitle = "Ayn | AI-Powered Quality & Compliance"
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ayn-edu.com"

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  generator: "Next.js",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "Ayn",
    images: [{ url: "/apple-icon.png", width: 512, height: 512, alt: "Ayn" }],
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  icons: {
    icon: "/logo2.png",
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased ${inter.variable} ${geist.variable} ${geistMono.variable} ${notoSansArabic.variable} ${sora.variable}`}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange storageKey="ayn-theme">
            <UiLanguageProvider>
              {children}
              <Toaster richColors position="top-right" />
            </UiLanguageProvider>
          </ThemeProvider>
        </AuthProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
