"use client";

import { useEffect } from "react";
import { generateThemeCss, resolveEditionTheme } from "@/lib/colorUtils";

interface ThemeInjectorProps {
  initialPrimary?: string | null;
  initialSecondary?: string | null;
  initialBg?: string | null;
}

export default function ThemeInjector({
  initialPrimary,
  initialSecondary,
  initialBg,
}: ThemeInjectorProps) {
  const { primary, secondary, bg } = resolveEditionTheme(
    initialPrimary,
    initialSecondary,
    initialBg
  );

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
    applyTheme(primary, secondary, bg);

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
  }, [primary, secondary, bg]);

  return (
    <style
      id="app-dynamic-theme-ssr"
      dangerouslySetInnerHTML={{
        __html: generateThemeCss(primary, secondary, bg),
      }}
    />
  );
}
