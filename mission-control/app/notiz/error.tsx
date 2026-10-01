"use client";
import { ErrorState } from "@/components/workspace/States";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="workspace-standalone">
      <ErrorState retry={reset} />
    </main>
  );
}
