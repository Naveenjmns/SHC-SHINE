import type { MetadataRoute } from "next";
import { getActiveEdition, festTitle } from "@/lib/eventService";

// Built from the active edition at request time (manifests are otherwise cached at build time)
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let edition: Awaited<ReturnType<typeof getActiveEdition>> | null = null;
  try {
    edition = await getActiveEdition();
  } catch {
    // Neutral defaults below
  }
  const title = festTitle(edition);
  const host = [edition?.hostDepartment, edition?.institutionName].filter(Boolean).join(", ");

  return {
    name: edition?.institutionShortName ? `${title} — ${edition.institutionShortName}` : title,
    short_name: title,
    description: `Intercollegiate fest & event management platform${host ? ` — ${host}` : ""}.`,
    start_url: "/",
    display: "standalone",
    background_color: edition?.themeBgColor || "#F8F9FB",
    theme_color: edition?.themePrimaryAccent || "#006BFF",
    orientation: "any",
    scope: "/",
    lang: "en-IN",
    categories: ["events", "education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
