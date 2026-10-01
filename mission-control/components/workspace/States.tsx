import Link from "next/link";
export function LoadingState({
  label = "Inhalte werden geladen …",
}: {
  label?: string;
}) {
  return (
    <section role="status" aria-label={label} className="workspace-state">
      <span className="sr-only">{label}</span>
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
    </section>
  );
}
export function EmptyState({
  title,
  children,
  href,
  label,
}: {
  title: string;
  children: React.ReactNode;
  href: string;
  label: string;
}) {
  return (
    <section className="workspace-state">
      <h2>{title}</h2>
      <p>{children}</p>
      <Link className="workspace-button" href={href}>
        {label}
      </Link>
    </section>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message?: string;
  retry: () => void;
}) {
  return (
    <section role="alert" className="workspace-state">
      <h2>Das hat gerade nicht geklappt.</h2>
      <p>{message || "Bitte prüfe deine Verbindung und versuche es erneut."}</p>
      <button className="workspace-button" onClick={retry}>
        Erneut versuchen
      </button>
    </section>
  );
}
