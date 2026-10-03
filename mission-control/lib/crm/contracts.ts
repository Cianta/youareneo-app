import type { Contact } from "@/lib/workspace/contacts";
export const CRM_PROVIDERS = ["hubspot", "ghl"] as const;
export type CrmProvider = (typeof CRM_PROVIDERS)[number];
export const CONTACT_STAGES = [
  "neu",
  "im_gespraech",
  "verbunden",
  "ruhend",
] as const;
export type ContactStage = (typeof CONTACT_STAGES)[number];
export const STAGE_LABELS: Record<ContactStage, string> = {
  neu: "Neu entdeckt",
  im_gespraech: "Im Gespräch",
  verbunden: "Verbunden",
  ruhend: "Ruhend",
};
export type MemberContact = Contact & {
  source: CrmProvider;
  stage?: ContactStage;
  note?: string;
  nextContact?: string;
  tags?: string[];
  favorite?: boolean;
  remoteUpdatedAt?: string;
};
export function mergeImported(
  existing: MemberContact[],
  incoming: MemberContact[],
) {
  const old = new Map(existing.map((c) => [c.id, c]));
  for (const c of incoming) {
    const previous = old.get(c.id);
    old.set(c.id, {
      ...c,
      ...(previous
        ? {
            stage: previous.stage,
            note: previous.note,
            nextContact: previous.nextContact,
            favorite: previous.favorite,
            workspace: previous.workspace,
          }
        : {}),
      tags: [...new Set([...(previous?.tags ?? []), ...(c.tags ?? [])])],
    });
  }
  return [...old.values()];
}
