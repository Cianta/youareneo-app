"use client";
import { ErrorState } from "@/components/workspace/States";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <ErrorState retry={reset} />;
}
