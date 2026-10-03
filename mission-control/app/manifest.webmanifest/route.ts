import { brandConfig } from "@/lib/brand";
export const dynamic = "force-dynamic";
export async function GET() {
  const { appName } = brandConfig();
  return Response.json(
    {
      id: "/notiz",
      name: appName,
      short_name: appName.slice(0, 24),
      description: "Dein Guiding Space mit Trinity, Gedanken und Projekten",
      lang: "de",
      start_url: "/notiz",
      scope: "/",
      display: "standalone",
      background_color: "#f8f8f7",
      theme_color: "#f8f8f7",
      icons: [
        {
          src: "/pwa/trinity-sun-v2-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/pwa/trinity-sun-v2-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/pwa/trinity-sun-v2-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
      shortcuts: [
        {
          name: "Neue Sprachnotiz",
          short_name: "Aufnehmen",
          url: "/notiz?rec=1",
          icons: [{ src: "/pwa/trinity-sun-v2-192.png", sizes: "192x192" }],
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "no-cache",
      },
    },
  );
}
