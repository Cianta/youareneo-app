export type NeoApp = {
  slug: string;
  name: string;
  category: string;
  description: string;
  vision: string;
  href: string;
  legacyUrl?: string;
  state: "trinity" | "legacy" | "source-needed" | "portal";
};

// Verified destinations, 02.10.2026. Old domains still redirect to FuseBase.
// Keep the old entry points; do not fabricate a completed account migration.
export const neoApps: readonly NeoApp[] = [
  {slug:"buzz",name:"Buzz · Teamchat",category:"Menschen & Zusammenarbeit",description:"Der vorhandene Vereinschat für Menschen und Agenten, wieder direkt erreichbar.",vision:"Ein ruhiger Treffpunkt für das Team. Der bestehende Buzz-Zugang bleibt im Vereinsportal; pro Gerät wird derzeit eine persönliche Einladung benötigt.",href:"/dashboard/apps/buzz",legacyUrl:"https://archiv.youareneo.com/app/",state:"portal"},
  { slug: "radio", name: "Radio Eden", category: "Klangwelten", description: "Ein warmes Kneipenradio zwischen Werkstatt und Wintergarten.", vision: "Nussbaum, Messing, Stofflautsprecher und eine bernsteinfarbene Skala. Ein Radio aus den 60ern, umrankt von viktorianischem Gartengrün.", href: "/dashboard/apps/radio", legacyUrl: "https://radio.youareneo.com/", state: "trinity" },
  { slug: "kochbuch", name: "Das Küchenschatzbuch", category: "Küche & Jahreszeiten", description: "Deine Rezepte zwischen goldenen Buchkanten und Kräutern.", vision: "Ein dunkelgrünes Schatzbuch mit geprägtem Messing, Papierseiten und botanischen Zeichnungen. Eigene Rezepte werden zu Fundstücken für den Alltag.", href: "/dashboard/apps/kochbuch", state: "trinity" },
  { slug: "visual-room", name: "Visual Room", category: "Sehen & Ankommen", description: "Ein verwunschener Garten für Licht, Klang und Stille.", vision: "Ein gläsernes viktorianisches Gewächshaus bei Nacht. Lichtbilder auf dunklem Wasser; ruhige, abschaltbare Bewegung und eine sofort erreichbare Wiedergabe.", href: "/dashboard/apps/visual-room", legacyUrl: "https://visual-room.youareneo.com/", state: "legacy" },
  { slug: "kinoraum", name: "Kinoraum", category: "Film & Begegnung", description: "Ein kleines Salon-Kino mit Samt, Holz und warmem Licht.", vision: "Ein privates Lichtspielhaus: dunkelroter Samt, nummerierte Eintrittskarten, Messinglampen. Das Programm steht vor der Kulisse; eine leichte Listenansicht auf dem Handy.", href: "/dashboard/apps/kinoraum", state: "source-needed" },
  { slug: "frequency-room", name: "Frequency Room", category: "Spielen & Hören", description: "Eine Klangwerkstatt mit analogen Instrumenten und klaren Reglern.", vision: "Garagenstudio trifft viktorianisches Experimentierzimmer: Holzpult, Kabel, Bakelitknöpfe und ein kleines Oszilloskop. Audio und MIDI starten nur nach eigener Aktion.", href: "/dashboard/apps/frequency-room", legacyUrl: "https://frequency.youareneo.com/", state: "legacy" },
  { slug: "good-news", name: "Good News", category: "Lesen & Entdecken", description: "Eine helle Zeitungsstube für belegte gute Nachrichten.", vision: "Papier, Druckerschwärze und ein grüner Lesetisch. Echte Quellen und Datum an jedem Artikel; kein erfundener Nachrichtenstrom und keine endlose Wand aus Animationen.", href: "/dashboard/apps/good-news", legacyUrl: "https://good-news.youareneo.com/", state: "legacy" },
  { slug: "art-atelier", name: "Art Atelier", category: "Gestalten & Sammeln", description: "Ein lichtdurchflutetes Künstleratelier mit Raum zum Arbeiten.", vision: "Eine verwitterte Orangerie als Atelier: Leinen, Farbtuben, Skizzen und ein Kolibri. Große Zeichenfläche, sichtbare Werkzeuge und ein schneller eigener Bilderkasten.", href: "/dashboard/apps/art-atelier", legacyUrl: "https://art.youareneo.com/", state: "legacy" },
  { slug: "living-arts-room", name: "Living Arts Room", category: "Wohnen & Betrachten", description: "Ein Garten-Salon für Bilder, Geschichten und Tageslicht.", vision: "Ein bewohnter Salon mit Kamin, Farnen und alten Bilderrahmen. Die eigene Sammlung steht im Mittelpunkt; Lichtwechsel bleiben optional und sparsam.", href: "/dashboard/apps/living-arts-room", legacyUrl: "https://living-arts-room.youareneo.com/", state: "legacy" },
  { slug: "trinity-os", name: "guiding.space", category: "Ordnen & Verbinden", description: "Dein Guiding Space für Gedanken, Aufgaben und Projekte.", vision: "Der ruhige Schreibtisch zwischen all den Räumen. Klare Aufgaben, kurze Wege und persönliche Inhalte hinter derselben Anmeldung.", href: "/dashboard", state: "trinity" },
];
export const appFor = (slug: string) => neoApps.find(app => app.slug === slug);
