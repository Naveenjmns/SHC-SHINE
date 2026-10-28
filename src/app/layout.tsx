import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-brand",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#F8F9FB",
};

// Titles and descriptions come from the active edition, so the app carries no institution names
export async function generateMetadata(): Promise<Metadata> {
  let edition: Awaited<ReturnType<typeof getActiveEdition>> | null = null;
  try {
    edition = await getActiveEdition();
  } catch {
    // Fall back to neutral defaults below
  }
  const title = festTitle(edition);
  const host = [edition?.hostDepartment, edition?.institutionName].filter(Boolean).join(", ");
  const description =
    edition?.description ||
    `${title}: intercollegiate fest and event management platform${host ? ` by ${host}` : ""}. Register delegations, explore competitions, track live podiums and digital passes.`;

  return {
    title: edition?.tagline ? `${title} — ${edition.tagline}` : title,
    description,
    applicationName: title,
    manifest: "/manifest.webmanifest",
    keywords: [edition?.name, edition?.institutionShortName, "college fest", "symposium", "intercollegiate", "tech fest", "event management", "competitions"].filter(
      (k): k is string => Boolean(k)
    ),
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title,
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [
        { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_IN",
    },
  };
}

import AuthProvider from "@/components/AuthProvider";
import { ToastProvider } from "@/components/ToastProvider";
import PwaRegister from "@/components/PwaRegister";
import InstallPwaPrompt from "@/components/InstallPwaPrompt";
import ThemeInjector from "@/components/ThemeInjector";
import MobileTabBar from "@/components/layout/MobileTabBar";
import { getActiveEdition, festTitle } from "@/lib/eventService";

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
      className={`${manrope.variable} h-full antialiased`}
    >
      <head>
        <ThemeInjector
          initialPrimary={activeEdition?.themePrimaryAccent}
          initialSecondary={activeEdition?.themeSecondaryAccent}
          initialBg={activeEdition?.themeBgColor}
        />
      </head>
      <body className="min-h-full flex flex-col bg-canvas text-ink font-sans">
        <AuthProvider>
          <ToastProvider>
            {children}
            <MobileTabBar />
            <PwaRegister />
            <InstallPwaPrompt />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
