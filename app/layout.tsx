import type React from "react"
import type { Metadata, Viewport } from "next"
import { Oswald, Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const _oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
})
const _inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const _jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "BKK-TEAMS",
  description: "BKK-TEAMS — SES vehicle dispatch and incident management",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BKK-TEAMS",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#05070a",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`bg-background ${_oswald.variable} ${_inter.variable} ${_jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
