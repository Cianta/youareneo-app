import ChatWorkspace from "@/components/chat/ChatWorkspace";
import { transcriptionConfig } from "@/lib/voice/transcription-config";
export const dynamic = "force-dynamic";
export default function ChatPage() {
  return (
    <ChatWorkspace
      providerLabel={
        transcriptionConfig().provider === "infomaniak"
          ? "Infomaniak, Schweiz"
          : transcriptionConfig().provider === "openai"
            ? "OpenAI"
            : "noch nicht eingerichtet"
      }
    />
  );
}
