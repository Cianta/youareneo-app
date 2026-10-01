import { json } from "@/lib/auth/http";
// Configuration is managed exclusively in the server .env by its owner.
// Keep the endpoint, but never read, reveal or write configuration from the app.
function unavailable() {
  return json(
    {
      ok: false,
      error: "Die Server-Konfiguration wird außerhalb der App verwaltet.",
    },
    410,
  );
}
export const GET = unavailable;
export const POST = unavailable;
