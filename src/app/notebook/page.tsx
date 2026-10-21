"use client";

import { useEffect, useState } from "react";

type Note = { id: string; title: string; body: string };

const KEY = "gvhs-notebook";

export default function NotebookPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setNotes(JSON.parse(raw) as Note[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(notes));
  }, [notes, ready]);

  function reset() {
    setEditing(null);
    setTitle("");
    setBody("");
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (editing) {
      setNotes((list) =>
        list.map((n) => (n.id === editing ? { ...n, title: title.trim(), body } : n))
      );
    } else {
      setNotes((list) => [
        { id: crypto.randomUUID(), title: title.trim(), body },
        ...list,
      ]);
    }
    reset();
  }

  return (
    <div className="mx-auto max-w-[800px] px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#1f2930]">
        My Notebook
      </h1>
      <p className="mt-2 text-sm text-[#354652]">Notes stay in this browser.</p>
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
                onClick={() => setNotes((list) => list.filter((n) => n.id !== note.id))}
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
