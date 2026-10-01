import { HttpError } from "@/lib/auth/http";
import type { ChatMessage } from "./contracts";
export function chatMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > 12)
    throw new HttpError(
      400,
      "Bitte beginne ein neues Gespräch; maximal zwölf Nachrichten je Anfrage.",
    );
  let size = 0;
  const messages = input.map((m, i) => {
    if (
      !m ||
      !["user", "assistant"].includes(m.role) ||
      typeof m.content !== "string" ||
      !m.content.trim() ||
      m.content.length > (m.role === "user" ? 4000 : 8000)
    )
      throw new HttpError(400, "Eine Nachricht ist leer oder zu lang.");
    if (i && input[i - 1].role === m.role)
      throw new HttpError(400, "Ungültige Gesprächsfolge.");
    size += m.content.length;
    return { role: m.role, content: m.content.trim() } as ChatMessage;
  });
  if (
    size > 20000 ||
    messages[0].role !== "user" ||
    messages.at(-1)?.role !== "user"
  )
    throw new HttpError(
      400,
      "Das Gespräch ist zu lang. Bitte beginne ein neues Gespräch.",
    );
  return messages;
}
