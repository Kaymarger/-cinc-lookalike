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
import type { CrmActivity, CrmPipeline } from "./cinc-crm";

const KEY = "gvhs-crm-overlay";

export type CrmTask = {
  id: string;
  title: string;
  due: string;
  done: boolean;
};

type State = {
  pipeline: Record<string, CrmPipeline>;
  hidden: string[];
  activity: Record<string, CrmActivity[]>;
  tasks: Record<string, CrmTask[]>;
  plans: Record<string, string>;
};

const EMPTY: State = {
  pipeline: {},
  hidden: [],
  activity: {},
  tasks: {},
  plans: {},
};

type Ctx = State & {
  ready: boolean;
  setPipeline: (id: string, pipeline: CrmPipeline) => void;
  hide: (ids: string[]) => void;
  appendActivity: (id: string, item: Omit<CrmActivity, "id" | "at"> & { at?: string }) => void;
  addTask: (id: string, title: string, due: string) => void;
  toggleTask: (id: string, taskId: string) => void;
  setPlan: (id: string, plan: string) => void;
};

const OverlayContext = createContext<Ctx | null>(null);

function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      pipeline: parsed.pipeline ?? {},
      hidden: parsed.hidden ?? [],
      activity: parsed.activity ?? {},
      tasks: parsed.tasks ?? {},
      plans: parsed.plans ?? {},
    };
  } catch {
    return EMPTY;
  }
}

export function CrmOverlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const setPipeline = useCallback((id: string, pipeline: CrmPipeline) => {
    setState((s) => ({ ...s, pipeline: { ...s.pipeline, [id]: pipeline } }));
  }, []);

  const hide = useCallback((ids: string[]) => {
    setState((s) => ({ ...s, hidden: [...new Set([...s.hidden, ...ids])] }));
  }, []);

  const appendActivity = useCallback(
    (id: string, item: Omit<CrmActivity, "id" | "at"> & { at?: string }) => {
      const entry: CrmActivity = {
        id: `crm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        at:
          item.at ??
          new Date().toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
        kind: item.kind,
        title: item.title,
        body: item.body,
        actor: item.actor ?? "Casey Archibald",
      };
      setState((s) => ({
        ...s,
        activity: { ...s.activity, [id]: [entry, ...(s.activity[id] ?? [])] },
      }));
    },
    []
  );

  const addTask = useCallback((id: string, title: string, due: string) => {
    const task: CrmTask = {
      id: `task-${Date.now()}`,
      title,
      due,
      done: false,
    };
    setState((s) => ({
      ...s,
      tasks: { ...s.tasks, [id]: [task, ...(s.tasks[id] ?? [])] },
    }));
  }, []);

  const toggleTask = useCallback((id: string, taskId: string) => {
    setState((s) => ({
      ...s,
      tasks: {
        ...s.tasks,
        [id]: (s.tasks[id] ?? []).map((t) =>
          t.id === taskId ? { ...t, done: !t.done } : t
        ),
      },
    }));
  }, []);

  const setPlan = useCallback((id: string, plan: string) => {
    setState((s) => ({ ...s, plans: { ...s.plans, [id]: plan } }));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      ...state,
      setPipeline,
      hide,
      appendActivity,
      addTask,
      toggleTask,
      setPlan,
    }),
    [ready, state, setPipeline, hide, appendActivity, addTask, toggleTask, setPlan]
  );

  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
}

export function useCrmOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useCrmOverlay must be used within CrmOverlayProvider");
  return ctx;
}
