"use client";

import { useEffect, useState } from "react";
import { AccountSearchList } from "@/components/account-searches";
import { pushAccount } from "@/lib/account-sync";
import { useDemoAuth } from "@/lib/demo-auth";

type Note = { id: string; title: string; body: string };

const KEY = "gvhs-notebook";

export default function NotebookPage() {
  const { user } = useDemoAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [propertyNotes, setPropertyNotes] = useState<{ propertyId: string; address: string; body: string }[]>([]);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    let cancel = false;
    const email = user?.email?.trim().toLowerCase() || "";
    if (!email) {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) setNotes(JSON.parse(raw) as Note[]);
      } catch {
        /* ignore */
      }
      setPropertyNotes([]);
      setReady(true);
      return () => {
        cancel = true;
      };
    }
    let localNotes: Note[] = [];
    let localProperty: { propertyId: string; address: string; body: string }[] = [];
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) localNotes = JSON.parse(raw) as Note[];
    } catch {
      /* ignore */
    }
    try {
      const propertyRaw = localStorage.getItem("gvhs-property-notes");
      const parsed = propertyRaw ? JSON.parse(propertyRaw) as { propertyId?: string; address?: string; body?: string; email?: string }[] : [];
      if (Array.isArray(parsed)) {
        localProperty = parsed.flatMap((note) => {
          const owner = (note.email || "").trim().toLowerCase();
          if ((owner && owner !== email) || !note.body || !note.propertyId) return [];
          return [{ propertyId: note.propertyId, address: note.address || "", body: note.body }];
        });
      }
    } catch {
      /* ignore */
    }
    void pushAccount(email, user?.name || "", {
      notebook: localNotes,
      notebookMode: "merge",
      propertyNotes: localProperty,
    }).then((snapshot) => {
      if (cancel) return;
      setNotes((snapshot?.notebook || []).map((note) => ({ id: note.id, title: note.title, body: note.body })));
      setPropertyNotes(snapshot?.propertyNotes || []);
      try {
        localStorage.removeItem(KEY);
        localStorage.removeItem("gvhs-property-notes");
      } catch {
        /* ignore */
      }
      setReady(true);
    });
    return () => {
      cancel = true;
    };
  }, [user?.email, user?.name]);

  useEffect(() => {
    if (!ready || user) return;
    localStorage.setItem(KEY, JSON.stringify(notes));
  }, [notes, ready, user]);

  function reset() {
    setEditing(null);
    setTitle("");
    setBody("");
  }

  function persist(next: Note[]) {
    setNotes(next);
    if (user?.email) void pushAccount(user.email, user.name, { notebook: next, notebookMode: "replace" });
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const next = editing
      ? notes.map((note) => (note.id === editing ? { ...note, title: title.trim(), body } : note))
      : [{ id: crypto.randomUUID(), title: title.trim(), body }, ...notes];
    persist(next);
    reset();
  }

  return (
    <div className="mx-auto max-w-[800px] px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#1f2930]">
        My Notebook
      </h1>
      <p className="mt-2 text-sm text-[#354652]">Notes are private to you and your agent.</p>
      <form onSubmit={save} className="mt-6 space-y-3 border border-[#dbe3e8] bg-white p-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Note title"
          aria-label="Note title"
          className="h-11 w-full border border-[#dbe3e8] px-3 text-sm outline-none focus:border-[#1976d2]"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a note"
          aria-label="Note body"
          rows={4}
          className="w-full border border-[#dbe3e8] px-3 py-2 text-sm outline-none focus:border-[#1976d2]"
        />
        <div className="flex gap-2">
          <button type="submit" className="h-10 bg-[#1976d2] px-5 text-sm font-bold text-white uppercase">
            {editing ? "Update note" : "Add note"}
          </button>
          {editing && (
            <button type="button" onClick={reset} className="h-10 border border-[#dbe3e8] px-4 text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>
      <AccountSearchList />
      {propertyNotes.length ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Notes on homes</h2>
          <ul className="mt-3 space-y-3">
            {propertyNotes.map((note) => (
              <li key={`${note.propertyId}-${note.body.slice(0, 12)}`} className="border border-[#dbe3e8] bg-white p-4">
                <p className="font-semibold">{note.address || "Listing note"}</p>
                <p className="mt-1 text-sm whitespace-pre-wrap text-[#354652]">{note.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <ul className="mt-6 space-y-3">
        {notes.map((note) => (
          <li key={note.id} className="border border-[#dbe3e8] bg-white p-4">
            <p className="font-semibold">{note.title}</p>
            {note.body && <p className="mt-1 text-sm whitespace-pre-wrap text-[#354652]">{note.body}</p>}
            <div className="mt-3 flex gap-3 text-sm">
              <button
                type="button"
                className="text-[#1976d2]"
                onClick={() => {
                  setEditing(note.id);
                  setTitle(note.title);
                  setBody(note.body);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-[#e53935]"
                onClick={() => persist(notes.filter((item) => item.id !== note.id))}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
