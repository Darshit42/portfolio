import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";

/**
 * Shared overlay shell: dimmed backdrop, centered panel, accessible close.
 * Esc/M are handled globally in GameRoot; backdrop-click and the X close here.
 */
export default function Modal({
  title,
  subtitle,
  accent,
  onClose,
  children,
  footer,
  maxWidth = "max-w-2xl",
}: {
  title?: string;
  subtitle?: string;
  accent?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-fade-in-fast"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`panel relative flex max-h-[88vh] w-full ${maxWidth} flex-col rounded-2xl shadow-panel outline-none animate-fade-in`}
        style={accent ? { boxShadow: `0 0 0 1px ${accent}33, 0 10px 40px -12px #000` } : undefined}
      >
        {(title || subtitle) && (
          <header
            className="flex items-start justify-between gap-4 border-b border-realm-edge px-5 py-4"
            style={accent ? { boxShadow: `inset 0 3px 0 ${accent}` } : undefined}
          >
            <div>
              {title && <h2 className="font-display text-xl font-bold text-realm-text">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-sm" style={{ color: accent ?? "#8b97b0" }}>{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="btn-ghost shrink-0 rounded-lg p-2"
            >
              <CloseIcon width={18} height={18} />
            </button>
          </header>
        )}

        <div className="scroll-thin overflow-y-auto px-5 py-4">{children}</div>

        {footer && <footer className="border-t border-realm-edge px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}
