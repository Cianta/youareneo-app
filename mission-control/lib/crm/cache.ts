import { readFile, writeFile, mkdir, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { MemberContact } from "./contracts";
const locks = new Map<string, Promise<unknown>>();
function fileFor(root: string, userId: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId,
    )
  )
    throw Error("Invalid account identifier");
  return path.join(root, "crm-users", userId + ".json");
}
export function crmRoot() {
  return path.join(process.env.DATA_DIR || "./data", "private", "crm");
}
export async function readMemberContacts(
  root: string,
  userId: string,
): Promise<MemberContact[]> {
  try {
    const data = JSON.parse(await readFile(fileFor(root, userId), "utf8"));
    if (!Array.isArray(data)) throw Error("Invalid CRM cache");
    return data;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}
export async function updateMemberContacts(
  root: string,
  userId: string,
  update: (old: MemberContact[]) => MemberContact[],
) {
  const file = fileFor(root, userId),
    previous = locks.get(file) ?? Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(async () => {
      const contacts = update(await readMemberContacts(root, userId));
      if (contacts.length > 10000) throw Error("Contact limit");
      const temp = file + "." + randomUUID() + ".tmp";
      await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
      try {
        await writeFile(temp, JSON.stringify(contacts), {
          encoding: "utf8",
          mode: 0o600,
        });
        await rename(temp, file);
      } finally {
        await unlink(temp).catch(() => {});
      }
      return contacts;
    });
  locks.set(file, next);
  try {
    return await next;
  } finally {
    if (locks.get(file) === next) locks.delete(file);
  }
}
