"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "gvhs-agent-tasks";

export type TaskStatus = "todo" | "done";
export type TaskPriority = "high" | "normal" | "low";

export type AgentTask = {
  id: string;
  title: string;
  dueAt: string;
  status: TaskStatus;
  priority: TaskPriority;
  leadId?: string;
  leadName?: string;
  notes?: string;
  createdAt: string;
};

type CreateTaskInput = {
  title: string;
  dueAt: string;
  priority?: TaskPriority;
  leadId?: string;
  leadName?: string;
  notes?: string;
};

type Ctx = {
  ready: boolean;
  tasks: AgentTask[];
  add: (input: CreateTaskInput) => AgentTask;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  openTasks: AgentTask[];
  overdue: AgentTask[];
  dueToday: AgentTask[];
};

const TasksContext = createContext<Ctx | null>(null);

function dayStart(offset = 0) {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

const SEED: AgentTask[] = [
  {
    id: "task-1",
    title: "Call Jordan Lee — Coronado showing request",
    dueAt: dayStart(0),
    status: "todo",
    priority: "high",
    leadId: "lead-seed-1",
    leadName: "Jordan Lee",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "task-2",
    title: "Send Westside comps to Priya Sharma",
    dueAt: dayStart(0),
    status: "todo",
    priority: "normal",
    leadId: "lead-seed-2",
    leadName: "Priya Sharma",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "task-3",
    title: "Confirm Saturday showing with Marcus Chen",
    dueAt: dayStart(1),
    status: "todo",
    priority: "high",
    leadId: "lead-seed-3",
    leadName: "Marcus Chen",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "task-4",
    title: "Follow up Ava Nguyen — Coal Harbour inventory",
    dueAt: dayStart(-1),
    status: "todo",
    priority: "normal",
    leadId: "lead-seed-4",
    leadName: "Ava Nguyen",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "task-5",
    title: "Review new search-alert leads from overnight",
    dueAt: dayStart(0),
    status: "todo",
    priority: "low",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

function readTasks(): AgentTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as AgentTask[]) : [];
  } catch {
    return [];
  }
}

function isSameDay(iso: string, base = new Date()) {
  const d = new Date(iso);
  return (
    d.getFullYear() === base.getFullYear() &&
    d.getMonth() === base.getMonth() &&
    d.getDate() === base.getDate()
  );
}

export function AgentTasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const existing = readTasks();
    if (existing.length === 0) {
      setTasks(SEED);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
    } else {
      setTasks(existing);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, ready]);

  const add = useCallback((input: CreateTaskInput) => {
    const task: AgentTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: input.title.trim(),
      dueAt: input.dueAt,
      status: "todo",
      priority: input.priority ?? "normal",
      leadId: input.leadId,
      leadName: input.leadName,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
    return task;
  }, []);

  const toggle = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "todo" ? "done" : "todo" }
          : t
      )
    );
  }, []);

  const remove = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const openTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "todo")
        .sort(
          (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
        ),
    [tasks]
  );

  const overdue = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return openTasks.filter((t) => new Date(t.dueAt).getTime() < start.getTime());
  }, [openTasks]);

  const dueToday = useMemo(
    () => openTasks.filter((t) => isSameDay(t.dueAt)),
    [openTasks]
  );

  const value = useMemo(
    () => ({
      ready,
      tasks,
      add,
      toggle,
      remove,
      openTasks,
      overdue,
      dueToday,
    }),
    [ready, tasks, add, toggle, remove, openTasks, overdue, dueToday]
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useAgentTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx)
    throw new Error("useAgentTasks must be used within AgentTasksProvider");
  return ctx;
}
