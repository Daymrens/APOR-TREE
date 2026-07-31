import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { Inter } from "next/font/google";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";
import PWAProvider from "@/components/PWAProvider";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "APOR Family Reunion",
  description: "The APOR family reunion — connect, celebrate, and reminisce together.",
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", type: "image/png", sizes: "192x192", url: "/icons/icon-192.png" },
    { rel: "icon", type: "image/png", sizes: "512x512", url: "/icons/icon-512.png" },
  ],
  themeColor: "#0A1410",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "APOR Reunion",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover",
  other: {
    "view-transition": "same-origin",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <PWAProvider />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
