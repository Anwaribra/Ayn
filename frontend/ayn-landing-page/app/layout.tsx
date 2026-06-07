/* eslint-disable react-refresh/only-export-components */
import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/react"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { UiLanguageProvider } from "@/lib/ui-language-context"
import { Cairo } from "next/font/google"
import "./globals.css"

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-cairo",
  display: "swap",
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
    icon: [
      { url: "/ayn-icon.svg", type: "image/png", sizes: "any" },
      { url: "/icon.svg", type: "image/png", sizes: "any" },
    ],
    shortcut: [{ url: "/ayn-icon.svg", type: "image/png", sizes: "any" }],
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
      <body suppressHydrationWarning className={`font-sans antialiased ${cairo.variable}`}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange storageKey="ayn-theme">
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
