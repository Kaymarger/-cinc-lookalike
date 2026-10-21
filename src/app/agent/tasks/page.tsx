"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  useAgentTasks,
  type TaskPriority,
} from "@/lib/agent-tasks";
import { useLeads } from "@/lib/leads";
import { cn } from "@/lib/utils";

function formatDue(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = (day.getTime() - today.getTime()) / 86400000;
  if (diff < 0) return `Overdue · ${d.toLocaleDateString("en-CA")}`;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function AgentTasksPage() {
  const { ready, tasks, add, toggle, remove, openTasks, overdue } =
    useAgentTasks();
  const { leads } = useLeads();
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [leadId, setLeadId] = useState("");
  const [filter, setFilter] = useState<"open" | "done" | "all">("open");

  const visible = useMemo(() => {
    let list = [...tasks];
    if (filter === "open") list = list.filter((t) => t.status === "todo");
    if (filter === "done") list = list.filter((t) => t.status === "done");
    return list.sort(
      (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    );
  }, [tasks, filter]);

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const lead = leads.find((l) => l.id === leadId);
    add({
      title: title.trim(),
      dueAt: new Date(dueAt).toISOString(),
      priority,
      leadId: lead?.id,
      leadName: lead?.name,
    });
    setTitle("");
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cedar)]">
            Follow-ups
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--cedar-deep)]">
            Tasks
          </h1>
          <p className="mt-1 text-sm text-[#666]">
            {!ready
              ? "Loading…"
              : `${openTasks.length} open · ${overdue.length} overdue`}
          </p>
        </div>
        <div className="flex gap-2">
          {(["open", "done", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "h-9 px-3 text-sm font-medium capitalize",
                filter === f
                  ? "bg-[var(--cedar)] text-white"
                  : "border border-[#ddd] bg-white text-[#333]"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={onAdd}
        className="mt-6 grid gap-3 border border-[#dbe3e8] bg-white p-4 sm:grid-cols-[1.4fr_1fr_auto_auto_auto]"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task…"
          required
          className="h-10 border border-[#ddd] px-3 text-sm outline-none focus:border-[var(--cedar)]"
        />
        <select
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          className="h-10 border border-[#ddd] px-2 text-sm"
        >
          <option value="">No linked lead</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="h-10 border border-[#ddd] px-2 text-sm"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className="h-10 border border-[#ddd] px-2 text-sm"
        >
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center gap-1.5 bg-[var(--cedar)] px-4 text-sm font-semibold text-white hover:brightness-95"
        >
          <Plus className="size-4" />
          Add
        </button>
      </form>

      <ul className="mt-6 divide-y divide-[#eee] border border-[#dbe3e8] bg-white">
        {visible.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-[#666]">
            No tasks in this view.
          </li>
        ) : (
          visible.map((task) => {
            const overdueTask =
              task.status === "todo" &&
              new Date(task.dueAt).setHours(0, 0, 0, 0) <
                new Date().setHours(0, 0, 0, 0);
            return (
              <li
                key={task.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3",
                  task.status === "done" && "opacity-60"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(task.id)}
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center border",
                    task.status === "done"
                      ? "border-[var(--cedar)] bg-[var(--cedar)] text-white"
                      : "border-[#ccc] bg-white"
                  )}
                  aria-label={
                    task.status === "done" ? "Mark incomplete" : "Complete"
                  }
                >
                  {task.status === "done" ? "✓" : null}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium text-[#222]",
                      task.status === "done" && "line-through"
                    )}
                  >
                    {task.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[#888]">
                    {task.leadId ? (
                      <Link
                        href={`/agent/leads/${task.leadId}`}
                        className="text-[var(--cedar)] hover:underline"
                      >
                        {task.leadName}
                      </Link>
                    ) : (
                      "General"
                    )}
                    {" · "}
                    <span
                      className={cn(overdueTask && "font-semibold text-red-600")}
                    >
                      {formatDue(task.dueAt)}
                    </span>
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-[10px] font-bold uppercase",
                    task.priority === "high"
                      ? "text-red-600"
                      : task.priority === "low"
                        ? "text-[#999]"
                        : "text-[var(--cedar)]"
                  )}
                >
                  {task.priority}
                </span>
                <button
                  type="button"
                  onClick={() => remove(task.id)}
                  className="text-[#aaa] hover:text-red-600"
                  aria-label="Delete task"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
