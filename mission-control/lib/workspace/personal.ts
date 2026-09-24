"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
export type Area =
  | "Leben"
  | "Gesundheit"
  | "Beziehungen"
  | "Beruf"
  | "Kreativität"
  | "Gemeinschaft";
export const AREAS: Area[] = [
  "Leben",
  "Gesundheit",
  "Beziehungen",
  "Beruf",
  "Kreativität",
  "Gemeinschaft",
];
export const AREA_COLORS: Record<string, string> = {
  Leben: "#94c5a4",
  Gesundheit: "#5cc9bd",
  Beziehungen: "#ee9aac",
  Beruf: "#86b9ed",
  Kreativität: "#c1a0ec",
  Gemeinschaft: "#e5c180",
  Notiz: "#dd9b73",
};
export type Shortcut = {
  id: string;
  label: string;
  href: string;
  icon: string;
  category: string;
};
export type SoulGoal = {
  id: string;
  title: string;
  why: string;
  step: string;
  area: Area;
  due: string;
  done: boolean;
  projectId: string;
};
export type BrainNote = {
  id: string;
  title: string;
  body: string;
  area: Area;
  links: string[];
  updatedAt: string;
};
export type PersonalState = {
  bookmarks: Shortcut[];
  customLinks: Shortcut[];
  hiddenLinks: string[];
  goals: SoulGoal[];
  notes: BrainNote[];
  relations: { from: string; to: string }[];
  navOpen: Record<string, boolean>;
  cosmosVisible: boolean;
  mission: string;
  values: string;
  astroPin: string;
  motion: boolean;
  set: (patch: Partial<Omit<PersonalState, "set">>) => void;
};
export const usePersonal = create<PersonalState>()(
  persist(
    (set) => ({
      bookmarks: [],
      customLinks: [],
      hiddenLinks: [],
      goals: [],
      notes: [],
      relations: [],
      navOpen: {},
      cosmosVisible: true,
      mission: "",
      values: "",
      astroPin: "chinese",
      motion: true,
      set,
    }),
    { name: "trinity-personal-v1" },
  ),
);
export function safeLink(value: string): string | null {
  const s = value.trim();
  if (/^\/dashboard(?:\/[^\s\\]*)?(?:\?[^\s\\]*)?$/.test(s)) return s;
  try {
    const u = new URL(s);
    return ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
