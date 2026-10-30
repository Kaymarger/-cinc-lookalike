"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useChrome } from "./chrome-context";
import { EmailComposer, TextComposer, type MailDraft } from "./compose-mail";

export type { MailDraft };

export function Caret({ className = "text-current" }: { className?: string }) {
  return (
    <svg className={className} width="10" height="6" viewBox="0 0 10 6" aria-hidden>
      <path d="M1 1.15 5 4.85 9 1.15" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const checkCls = "size-[14px] shrink-0 accent-[#60717b]";

export function Btn({
  children,
  onClick,
  kind = "ghost",
  disabled,
  type = "button",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "ghost" | "teal" | "blue" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  title?: string;
}) {
  const cls =
    kind === "teal"
      ? "border-[#1c93b5] bg-[#1c93b5] text-white hover:bg-[#187f9c]"
      : kind === "blue"
        ? "border-[#2f8fb8] bg-[#2f8fb8] text-white hover:bg-[#257aa0]"
        : kind === "danger"
          ? "border-[#d9363e] bg-white text-[#d9363e] hover:bg-[#fff5f5]"
          : "border-[#c8c8c8] bg-white text-[#444] hover:bg-[#f4f4f4]";
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-6 items-center gap-1 rounded-[2px] border px-2 text-[12px] disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-2 block text-[12px] text-[#444]">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "h-[26px] w-full rounded-[2px] border border-[#ccc] bg-white px-2 text-[13px] outline-none focus:border-[#1c93b5]";

export function ModalFrame({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/35 px-4 py-10" onMouseDown={onClose}>
      <div
        className={`max-h-[86vh] w-full overflow-auto bg-white shadow-xl ${wide ? "max-w-[760px]" : "max-w-[480px]"}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e5e5e5] px-4 py-3">
          <h2 className="text-[16px] font-semibold text-[#24323a]">{title}</h2>
          <button type="button" className="text-[18px] text-[#888]" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

export function Menu({
  label,
  items,
  header,
  footer,
  onFooter,
  disabled,
  className = "",
}: {
  label: ReactNode;
  items: { label: string; onClick?: () => void; href?: string; danger?: boolean; disabled?: boolean }[];
  header?: string;
  footer?: string;
  onFooter?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        className="inline-flex items-center gap-1 disabled:opacity-50"
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>
      {open ? (
        <div className="absolute left-0 z-40 mt-1 flex max-h-[260px] min-w-[220px] flex-col border border-[#d5d5d5] bg-white text-left shadow-md">
          <div className="min-h-0 flex-1 overflow-auto py-1">
            {header ? <p className="px-3 py-1 text-[11px] font-bold tracking-wide text-[#888] uppercase">{header}</p> : null}
            {items.map((item) =>
              item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  className={`block px-3 py-[6px] text-[13px] hover:bg-[#e8f6fb] ${item.danger ? "text-[#d9363e]" : "text-[#333]"}`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  disabled={item.disabled}
                  className={`block w-full px-3 py-[6px] text-left text-[13px] hover:bg-[#e8f6fb] disabled:text-[#aaa] ${item.danger ? "text-[#d9363e]" : "text-[#333]"}`}
                  onClick={() => {
                    setOpen(false);
                    item.onClick?.();
                  }}
                >
                  {item.label}
                </button>
              ),
            )}
          </div>
          {footer ? (
            <button
              type="button"
              className="border-t border-[#e0e0e0] bg-[#ececec] px-3 py-2 text-left text-[13px] text-[#666] hover:bg-[#e2e2e2]"
              onClick={() => {
                setOpen(false);
                onFooter?.();
              }}
            >
              {footer}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function useComposer() {
  const chrome = useChrome();
  return {
    email(to: string, onDone: (sent: boolean, value: MailDraft) => boolean | Promise<boolean | void> | void) {
      chrome.openModal(
        <EmailComposer
          to={to}
          onClose={chrome.closeModal}
          onSend={async (value) => {
            const ok = await onDone(true, value);
            if (ok !== false) chrome.closeModal();
          }}
          onDraft={(value) => {
            onDone(false, value);
            chrome.closeModal();
          }}
        />,
      );
    },
    text(to: string, onDone: (value: { to: string; body: string }) => boolean | Promise<boolean | void> | void) {
      chrome.openModal(
        <TextComposer
          to={to}
          onClose={chrome.closeModal}
          onSend={async (value) => {
            const ok = await onDone(value);
            if (ok !== false) chrome.closeModal();
          }}
        />,
      );
    },
  };
}

export function EmptyArt({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-[#d7eef5] text-2xl">✓</div>
      <p className="text-[15px] font-semibold text-[#2a9bb8]">{title}</p>
      <p className="mt-1 text-[13px] text-[#777]">{body}</p>
    </div>
  );
}

export function PageCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white ${className}`}>{children}</div>;
}
