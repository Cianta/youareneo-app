"use client";
import { useEffect, useRef } from "react";
export function Dialog({
  title,
  onClose,
  children,
  open = true,
}: {
  open?: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    const before = document.activeElement as HTMLElement | null;
    if (open) d.showModal();
    else d.close();
    return () => {
      d.close();
      if (before?.isConnected) before.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="workspace-dialog"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="workspace-dialog-inner">
        <header>
          <h2>{title}</h2>
          <button aria-label="Schließen" onClick={onClose}>
            ✕
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
