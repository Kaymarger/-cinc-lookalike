"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Mail,
  MessageSquare,
  RefreshCw,
  Smartphone,
  Trash2,
} from "lucide-react";
import { CRM_MESSAGES } from "@/lib/cinc-crm";
import { cn } from "@/lib/utils";

type Folder = "inbox" | "sent" | "drafts" | "trashed";

type Msg = {
  id: string;
  sender: string;
  preview: string;
  body: string;
  time: string;
  unread?: boolean;
  folder: Folder;
};

const KEY = "gvhs-agent-inbox";

function seed(): Msg[] {
  return CRM_MESSAGES.map((msg) => ({
    id: msg.id,
    sender: msg.sender,
    preview: msg.preview,
    body: msg.preview,
    time: msg.time,
    unread: msg.unread,
    folder: "inbox" as const,
  }));
}

function read(): Msg[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Msg[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function Inbox() {
  const params = useSearchParams();
  const folder = (params.get("folder") as Folder) || "inbox";
  const [messages, setMessages] = useState<Msg[]>([]);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [compose, setCompose] = useState<null | "email" | "text">(null);
  const [draft, setDraft] = useState({ to: "", body: "" });
  const [reply, setReply] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setMessages(read() ?? seed());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(messages));
  }, [messages, ready]);

  const visible = useMemo(() => {
    return messages.filter((msg) => {
      if (msg.folder !== (folder || "inbox")) return false;
      if (unreadOnly && !msg.unread) return false;
      return true;
    });
  }, [messages, folder, unreadOnly]);

  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const slice = visible.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const active = visible.find((msg) => msg.id === selected) ?? slice[0];

  function move(ids: string[], next: Folder) {
    setMessages((prev) =>
      prev.map((msg) => (ids.includes(msg.id) ? { ...msg, folder: next, unread: false } : msg))
    );
    setChecked({});
  }

  function saveMessage(status: Folder) {
    if (!draft.to.trim() && !draft.body.trim()) return;
    const msg: Msg = {
      id: `msg-${Date.now()}`,
      sender: draft.to.trim() || "Draft",
      preview: draft.body.trim() || "(no body)",
      body: draft.body.trim() || "(no body)",
      time: "Just now",
      folder: status,
    };
    setMessages((prev) => [msg, ...prev]);
    setCompose(null);
    setDraft({ to: "", body: "" });
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-[480px] flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#dbe4eb] bg-white px-3 py-2.5 sm:px-4">
        <input
          type="checkbox"
          className="rounded border-[#b8c5d0]"
          checked={slice.length > 0 && slice.every((msg) => checked[msg.id])}
          onChange={(e) => {
            const next = { ...checked };
            for (const msg of slice) next[msg.id] = e.target.checked;
            setChecked(next);
          }}
        />
        <button type="button" className="rounded p-1.5 text-[#8a9bab] hover:bg-[#eef3f7]" aria-label="New email" onClick={() => setCompose("email")}>
          <Mail className="h-4 w-4" />
        </button>
        <button type="button" className="rounded p-1.5 text-[#8a9bab] hover:bg-[#eef3f7]" aria-label="New text" onClick={() => setCompose("text")}>
          <Smartphone className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded p-1.5 text-[#8a9bab] hover:bg-[#eef3f7]"
          aria-label="Trash"
          onClick={() => {
            const ids = Object.entries(checked).filter(([, on]) => on).map(([id]) => id);
            move(ids.length ? ids : active ? [active.id] : [], "trashed");
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded p-1.5 text-[#8a9bab] hover:bg-[#eef3f7]"
          aria-label="Refresh"
          onClick={() => {
            setMessages(read() ?? seed());
            setPage(0);
          }}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setUnreadOnly((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1 rounded border px-2 py-1 text-[12px]",
            unreadOnly ? "border-[#00aeb6] text-[#00aeb6]" : "border-[#dbe4eb] text-[#5a6f82]"
          )}
        >
          <Filter className="h-3.5 w-3.5" /> {unreadOnly ? "Unread" : "Filters"}
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setCompose("email")} className="rounded bg-[#00aeb6] px-3 py-1.5 text-[12px] font-semibold text-white">
            New Email
          </button>
          <button type="button" onClick={() => setCompose("text")} className="rounded border border-[#00aeb6] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#00aeb6]">
            New Text
          </button>
          <span className="text-[12px] text-[#5a6f82]">
            {visible.length === 0 ? "0" : `${safePage * pageSize + 1}–${Math.min(visible.length, safePage * pageSize + slice.length)}`} of {visible.length}
          </span>
          <button type="button" className="rounded p-1 text-[#8a9bab] disabled:opacity-40" disabled={safePage === 0} onClick={() => setPage((n) => n - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" className="rounded p-1 text-[#8a9bab] disabled:opacity-40" disabled={safePage >= pageCount - 1} onClick={() => setPage((n) => n + 1)}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {compose && (
        <form
          className="flex flex-wrap items-end gap-2 border-b border-[#dbe4eb] bg-[#f7fbfd] px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            saveMessage("sent");
          }}
        >
          <label className="text-[11px] text-[#5a6f82]">
            To
            <input value={draft.to} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} className="mt-1 block h-8 rounded border border-[#dbe4eb] px-2 text-[12px]" />
          </label>
          <label className="min-w-[220px] flex-1 text-[11px] text-[#5a6f82]">
            {compose === "email" ? "Email" : "Text"}
            <input value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} className="mt-1 block h-8 w-full rounded border border-[#dbe4eb] px-2 text-[12px]" />
          </label>
          <button type="submit" className="h-8 rounded bg-[#00aeb6] px-3 text-[12px] font-semibold text-white">
            Send
          </button>
          <button type="button" className="h-8 rounded border border-[#dbe4eb] px-3 text-[12px]" onClick={() => saveMessage("drafts")}>
            Save draft
          </button>
        </form>
      )}

      <div className="flex min-h-0 flex-1">
        <ul className="w-full overflow-y-auto border-r border-[#dbe4eb] bg-[#f7fafc] md:w-[420px] lg:w-[480px]">
          {slice.map((msg) => {
            const isActive = msg.id === active?.id;
            return (
              <li key={msg.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(msg.id);
                    setMessages((prev) => prev.map((row) => (row.id === msg.id ? { ...row, unread: false } : row)));
                  }}
                  className={cn(
                    "flex w-full items-start gap-2 border-b border-[#e8eef3] px-3 py-3 text-left",
                    isActive ? "bg-white" : "hover:bg-white/80",
                    msg.unread && "font-semibold"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checked[msg.id])}
                    onChange={(e) => setChecked((c) => ({ ...c, [msg.id]: e.target.checked }))}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 rounded border-[#b8c5d0]"
                  />
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#27ae60]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] text-[#1a2b3c]">{msg.sender}</span>
                      <span className="shrink-0 text-[11px] font-normal text-[#8a9bab]">{msg.time}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[12px] font-normal text-[#5a6f82]">{msg.preview}</p>
                  </div>
                </button>
              </li>
            );
          })}
          {slice.length === 0 && (
            <li className="px-4 py-10 text-center text-[13px] text-[#8a9bab]">
              {ready ? `Nothing in ${folder}.` : "Loading…"}
            </li>
          )}
        </ul>

        <div className="hidden min-w-0 flex-1 flex-col bg-white md:flex">
          {active ? (
            <>
              <div className="border-b border-[#e8eef3] px-5 py-4">
                <p className="text-[15px] font-semibold text-[#1a2b3c]">{active.sender}</p>
                <p className="mt-1 text-[12px] text-[#8a9bab]">{active.time}</p>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5 text-[13px] leading-relaxed text-[#3d5164]">
                <p>{active.body}</p>
              </div>
              <form
                className="border-t border-[#e8eef3] px-5 py-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!reply.trim()) return;
                  setMessages((prev) => [
                    {
                      id: `msg-${Date.now()}`,
                      sender: `Reply to ${active.sender}`,
                      preview: reply.trim(),
                      body: reply.trim(),
                      time: "Just now",
                      folder: "sent",
                    },
                    ...prev,
                  ]);
                  setReply("");
                }}
              >
                <textarea
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply…"
                  className="w-full rounded border border-[#dbe4eb] px-3 py-2 text-[13px] outline-none focus:border-[#00aeb6]"
                />
                <button type="submit" className="mt-2 rounded bg-[#00aeb6] px-3 py-1.5 text-[12px] font-semibold text-white">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[13px] text-[#8a9bab]">
              Select a message
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommunicationsPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#5a6f82]">Loading inbox…</p>}>
      <Inbox />
    </Suspense>
  );
}
