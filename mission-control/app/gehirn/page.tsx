import BrainWorkspace from "@/components/brain/BrainWorkspace";
export default async function BrainPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <BrainWorkspace initialQuery={q?.slice(0, 120) || ""} />;
}
