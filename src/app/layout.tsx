import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#FF6B1A",
};

export const metadata: Metadata = {
  title: "SHINE — Intercollegiate Symposium & Event Management Platform",
  description:
    "SHINE is the premier intercollegiate symposium and event management platform. Register delegations, explore competitions, track live podiums, and manage accreditation dossiers.",
  applicationName: "SHINE",
  manifest: "/manifest.webmanifest",
  keywords: [
    "SHINE",
    "college fest",
    "symposium",
    "intercollegiate",
    "tech fest",
    "event management",
    "competitions",
  ],
  authors: [{ name: "SHINE Engineering Team" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SHINE",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "SHINE | Intercollegiate Symposium & Event Management Platform",
    description:
      "Join SHINE — the premier intercollegiate fest. On-stage & off-stage competitions, digital gate passes, live leaderboards, and more!",
    type: "website",
    locale: "en_IN",
  },
};

import AuthProvider from "@/components/AuthProvider";
import { ToastProvider } from "@/components/ToastProvider";
import PwaRegister from "@/components/PwaRegister";
import InstallPwaPrompt from "@/components/InstallPwaPrompt";
import ThemeInjector from "@/components/ThemeInjector";
import { getActiveEdition } from "@/lib/eventService";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let activeEdition = null;
  try {
    activeEdition = await getActiveEdition();
  } catch {
    // Fallback gracefully
  }

  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <ThemeInjector
          initialPrimary={activeEdition?.themePrimaryAccent}
          initialSecondary={activeEdition?.themeSecondaryAccent}
          initialBg={activeEdition?.themeBgColor}
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
        <AuthProvider>
          <ToastProvider>
            {children}
            <PwaRegister />
            <InstallPwaPrompt />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
