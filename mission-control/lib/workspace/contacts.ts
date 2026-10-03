"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Workspace } from "./personal";
export type Contact = {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  workspace: Workspace;
  source: "local" | "hubspot" | "ghl";
  updatedAt: string;
  stage?: "neu"|"im_gespraech"|"verbunden"|"ruhend";
  note?:string;nextContact?:string;tags?:string[];favorite?:boolean;
};
export const useContacts = create<{
  contacts: Contact[];
  merge: (items: Contact[]) => void;
}>()(
  persist(
    (set) => ({
      contacts: [],
      merge: (items) =>
        set((s) => ({
          contacts: [
            ...s.contacts.filter((c) => !items.some((n) => n.id === c.id)),
            ...items,
          ],
        })),
    }),
    { name: "trinity-contacts-v1" },
  ),
);
