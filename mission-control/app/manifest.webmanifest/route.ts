import { brandConfig } from "@/lib/brand";
export const dynamic = "force-dynamic";
export async function GET() {
  const { appName } = brandConfig();
  return Response.json(
    {
      id: "/notiz",
      name: appName,
      short_name: appName.slice(0, 24),
      description: "Deine persönlichen Sprach- und Textnotizen",
      lang: "de",
      start_url: "/notiz",
      scope: "/",
      display: "standalone",
      background_color: "#0a110d",
      theme_color: "#0a110d",
      icons: [
        {
          src: "/pwa/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/pwa/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/pwa/maskable-512.png",
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
          icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }],
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
