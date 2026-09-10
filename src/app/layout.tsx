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
  title: "SHINE 26 | Department of Computer Applications (PG) — Sacred Heart College",
  description:
    "SHINE 26 is the premier intercollegiate fest organized by the Department of Computer Applications (PG), Sacred Heart College (Autonomous), Tirupattur. Register now for exciting on-stage and off-stage events!",
  applicationName: "SHINE 26",
  manifest: "/manifest.webmanifest",
  keywords: [
    "SHINE 26",
    "Sacred Heart College",
    "Tirupattur",
    "college fest",
    "MCA",
    "computer applications",
    "intercollegiate",
    "tech fest",
  ],
  authors: [{ name: "Department of Computer Applications (PG), Sacred Heart College" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SHINE 26",
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
    title: "SHINE 26 | Sacred Heart College Fest",
    description:
      "Join SHINE 26 — the premier intercollegiate fest by the Dept. of Computer Applications (PG), Sacred Heart College. On-stage & off-stage events, prizes, and more!",
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
