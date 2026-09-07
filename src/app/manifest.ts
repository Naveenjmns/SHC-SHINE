import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SHINE 26 — Sacred Heart College Fest",
    short_name: "SHINE 26",
    description:
      "Premier Intercollegiate Fest & Event Management Platform — Department of Computer Applications (PG), Sacred Heart College (Autonomous), Tirupattur.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#FF6B1A",
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
