export const SAVE_PRODUCTS = ["foerder", "app"] as const;
export const NOTE_TYPES = ["aufgabe", "idee", "notiz", "termin"] as const;
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
export const MAX_RECORDING_SECONDS = 300;
export const AUDIO_BUCKET = "trinity-audio";
export type NoteType = (typeof NOTE_TYPES)[number];
export type NoteDraft = {
  title: string;
  transcript: string;
  summary: string;
  type: NoteType;
  project: string | null;
  tags: string[];
  due: string | null;
  assignee: string | null;
  source: "voice" | "text";
};
export type SavedNote = NoteDraft & {
  id: string;
  created_at: string;
  audio_path: string | null;
};
export type QueueEntry = {
  note_id: string;
  instruction: string;
  status: "wartet_auf_bestaetigung" | "freigegeben" | "erledigt" | "abgelehnt";
  result: string | null;
};
export function maySave(
  products: readonly string[],
  allowed: readonly string[] = SAVE_PRODUCTS,
) {
  return products.some((product) => allowed.includes(product));
}
export const emptyDraft = (): NoteDraft => ({
  title: "",
  transcript: "",
  summary: "",
  type: "notiz",
  project: null,
  tags: [],
  due: null,
  assignee: null,
  source: "text",
});
