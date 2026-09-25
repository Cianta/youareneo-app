"use client";
import Link from "next/link";
import { usePersonal } from "@/lib/workspace/personal";
import { categoriesOf, directoryLinks } from "@/lib/workspace/directory";
export function DirectoryMenu() {
  const s = usePersonal();
  return (
    <details
      className="w-nav-group"
      open={s.navOpen.directory ?? false}
      onToggle={(e) => {
        if (e.currentTarget.open !== (s.navOpen.directory ?? false))
          s.set({ navOpen: { ...s.navOpen, directory: e.currentTarget.open } });
      }}
    >
      <summary className="w-nav-link">▦ Alle Bereiche</summary>
      <nav>
        <Link className="w-nav-link" href="/dashboard/tools">
          Gesamtübersicht ↗
        </Link>
        {categoriesOf(
          [...directoryLinks, ...s.customLinks],
          s.linkCategories,
        ).map((c) => (
          <Link
            className="w-nav-link s-category-link"
            href={`/dashboard/tools#${encodeURIComponent(c)}`}
            key={c}
          >
            {c}
          </Link>
        ))}
      </nav>
    </details>
  );
}
