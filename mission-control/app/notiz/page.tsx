import { NoteWorkspace } from "@/components/voice/NoteWorkspace";
import { transcriptionConfig } from "@/lib/voice/transcription-config";
export const dynamic = "force-dynamic";
export default async function NotePage({
  searchParams,
}: {
  searchParams: Promise<{ rec?: string }>;
}) {
  return <NoteWorkspace autoStart={(await searchParams).rec === "1"} initialProvider={transcriptionConfig().provider} />;
}
