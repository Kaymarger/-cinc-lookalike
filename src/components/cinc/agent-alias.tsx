"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { agentPathToCinc } from "./route";

export function AgentAlias({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  void children;

  useEffect(() => {
    window.location.replace(agentPathToCinc(pathname));
  }, [pathname]);

  return (
    <div className="grid min-h-screen place-items-center bg-[#f5f5f5] text-[13px] text-[#666]">
      Opening CINC…
    </div>
  );
}
