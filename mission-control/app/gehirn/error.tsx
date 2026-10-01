"use client";
import { ErrorState } from "@/components/workspace/States";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      message="Der Wissensraum konnte nicht geöffnet werden."
      retry={reset}
    />
  );
}
