import { NoteWorkspace } from "@/components/voice/NoteWorkspace";
export default async function NotePage({
  searchParams,
}: {
  searchParams: Promise<{ rec?: string }>;
}) {
  return <NoteWorkspace autoStart={(await searchParams).rec === "1"} />;
}
