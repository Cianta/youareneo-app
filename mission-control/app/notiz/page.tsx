import { NoteWorkspace } from "@/components/voice/NoteWorkspace";
import { transcriptionConfig } from "@/lib/voice/transcription-config";
export const dynamic = "force-dynamic";
export default async function NotePage({
  searchParams,
}: {
  searchParams: Promise<{ rec?: string; note?: string; project?: string; tag?: string; type?: string }>;
}) {
  const params=await searchParams;
  return <NoteWorkspace initialNote={params.note} initialProject={params.project} initialTag={params.tag} initialType={params.type} autoStart={params.rec === "1"} initialProvider={transcriptionConfig().provider} />;
}
