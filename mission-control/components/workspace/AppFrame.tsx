"use client";
import { usePathname } from "next/navigation";
import { WorkspaceShell } from "./WorkspaceShell";
export function AppFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const workspace = path.startsWith("/dashboard") || path.startsWith("/notiz") || path === "/gehirn" || path === "/sprechen";
  return workspace ? <WorkspaceShell identity={null} allowGuest>{children}</WorkspaceShell> : <>{children}</>;
}
