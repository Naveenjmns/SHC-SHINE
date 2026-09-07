import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "SHINE 26 | Department of Computer Applications (PG) — Sacred Heart College",
  description:
    "SHINE 26 is the premier intercollegiate fest organized by the Department of Computer Applications (PG), Sacred Heart College (Autonomous), Tirupattur. Register now for exciting on-stage and off-stage events!",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
