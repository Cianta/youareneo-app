"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}
/** Native dialog provides focus trapping, Escape handling and focus restoration. */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  className,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    else if (!open && dialog?.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={title ? heading : undefined}
      aria-label={title ? undefined : "Dialog"}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "trinity-dialog",
        { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[
          size
        ],
        className,
      )}
    >
      <div className="trinity-dialog-inner">
        <header>
          <h2 id={heading}>{title}</h2>
          <button
            type="button"
            aria-label="Dialog schließen"
            className="w-icon"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="trinity-dialog-body">{open ? children : null}</div>
      </div>
    </dialog>
  );
}
