"use client";

import { useEffect } from "react";
import { generateThemeCss } from "@/lib/colorUtils";

interface ThemeInjectorProps {
  initialPrimary?: string | null;
  initialSecondary?: string | null;
  initialBg?: string | null;
}

export default function ThemeInjector({
  initialPrimary = "#FF6B1A",
  initialSecondary = "#D9A441",
  initialBg = "#FAF8F5",
}: ThemeInjectorProps) {
  useEffect(() => {
    const applyTheme = (primary: string, secondary: string, bg: string) => {
      let styleEl = document.getElementById("app-dynamic-theme") as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "app-dynamic-theme";
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = generateThemeCss(primary, secondary, bg);
    };

    // Apply initial theme
    applyTheme(
      initialPrimary || "#FF6B1A",
      initialSecondary || "#D9A441",
      initialBg || "#FAF8F5"
    );

    // Listen for live admin preview events
    const handleThemeUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        primary: string;
        secondary: string;
        bg: string;
      }>;
      if (customEvent.detail) {
        applyTheme(
          customEvent.detail.primary,
          customEvent.detail.secondary,
          customEvent.detail.bg
        );
      }
    };

    window.addEventListener("shine:theme-update", handleThemeUpdate);
    return () => {
      window.removeEventListener("shine:theme-update", handleThemeUpdate);
    };
  }, [initialPrimary, initialSecondary, initialBg]);

  return (
    <style
      id="app-dynamic-theme-ssr"
      dangerouslySetInnerHTML={{
        __html: generateThemeCss(
          initialPrimary || "#FF6B1A",
          initialSecondary || "#D9A441",
          initialBg || "#FAF8F5"
        ),
      }}
    />
  );
}
