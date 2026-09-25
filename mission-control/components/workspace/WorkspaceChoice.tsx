"use client";
import { usePersonal, type Workspace } from "@/lib/workspace/personal";
export function WorkspaceChoice({
  value,
  name = "workspace",
}: {
  value?: Workspace;
  name?: string;
}) {
  return (
    <label>
      Bereich
      <select
        className="w-input"
        name={name}
        defaultValue={value ?? usePersonal.getState().workspace}
      >
        <option value="private">Privat</option>
        <option value="organization">Organisation</option>
        <option value="both">Privat & Organisation</option>
      </select>
    </label>
  );
}
