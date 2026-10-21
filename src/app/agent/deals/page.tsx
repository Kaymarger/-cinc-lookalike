"use client";

import { useMemo, useState } from "react";
import { CRM_DEALS, type CrmDeal } from "@/lib/cinc-crm";
import { cn } from "@/lib/utils";

const STAGES: {
  id: CrmDeal["stage"];
  label: string;
}[] = [
  { id: "showing", label: "SHOWING" },
  { id: "offer", label: "OFFER MADE" },
  { id: "contract", label: "UNDER CONTRACT" },
  { id: "closed", label: "CLOSED" },
];

function sumPotential(deals: CrmDeal[]) {
  if (deals.length === 0) return { shown: "$--", pot: "$-- Potential" };
  const total = deals.reduce((acc, d) => {
    const n = Number(d.price.replace(/[^0-9.]/g, ""));
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
  const fmt =
    total >= 1_000_000
      ? `$${(total / 1_000_000).toFixed(2)}M`
      : `$${Math.round(total / 1000)}K`;
  return { shown: fmt, pot: `${fmt} Potential` };
}

export default function DealsDashboardPage() {
  const [tab, setTab] = useState<"purchases" | "listings">("purchases");
  const [deals, setDeals] = useState(CRM_DEALS);

  const byStage = useMemo(() => {
    const map: Record<CrmDeal["stage"], CrmDeal[]> = {
      showing: [],
      offer: [],
      contract: [],
      closed: [],
    };
    for (const d of deals) map[d.stage].push(d);
    return map;
  }, [deals]);

  function moveDeal(id: string, stage: CrmDeal["stage"]) {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, stage } : d)));
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-3rem)] flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#dbe4eb] bg-white px-4">
        <div className="flex">
          {(
            [
              ["purchases", "Purchases"],
              ["listings", "Listings"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "relative px-4 py-3 text-[13px]",
                tab === id
                  ? "font-semibold text-[#1a2b3c]"
                  : "text-[#5a6f82] hover:text-[#1a2b3c]"
              )}
            >
              {label}
              {tab === id && (
                <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-[#00aeb6]" />
              )}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2 py-2">
          <button
            type="button"
            className="rounded border border-[#00aeb6] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#00aeb6]"
          >
            Advertise Listings
          </button>
          <button
            type="button"
            className="rounded bg-[#00aeb6] px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            + Add Deal
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-[#dbe4eb] bg-[#f4f7f9] px-4 py-2.5">
        <select className="rounded border border-[#dbe4eb] bg-white px-2 py-1.5 text-[12px]">
          <option>Status: Active</option>
          <option>Status: All</option>
        </select>
        <select className="rounded border border-[#dbe4eb] bg-white px-2 py-1.5 text-[12px]">
          <option>Created: Anytime</option>
        </select>
        <select className="ml-auto rounded border border-[#dbe4eb] bg-white px-2 py-1.5 text-[12px]">
          <option>Sort By: Reminder Due Date</option>
        </select>
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        {tab === "listings" ? (
          <div className="mx-auto mt-16 max-w-md rounded-lg border border-[#dbe4eb] bg-white px-6 py-8 text-center shadow-sm">
            <p className="text-[15px] font-semibold text-[#1a2b3c]">
              No Listing Deals Found
            </p>
            <p className="mt-1 text-[13px] text-[#8a9bab]">
              Switch to Purchases or add a listing deal to get started.
            </p>
          </div>
        ) : (
          <div className="grid min-w-[900px] grid-cols-4 gap-3">
            {STAGES.map((stage) => {
              const items = byStage[stage.id];
              const totals = sumPotential(items);
              return (
                <div
                  key={stage.id}
                  className="flex min-h-[420px] flex-col rounded-lg border border-[#dbe4eb] bg-[#f4f7f9]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/deal-id");
                    if (id) moveDeal(id, stage.id);
                  }}
                >
                  <div className="rounded-t-lg border-b border-[#dbe4eb] bg-white px-3 py-3">
                    <p className="text-[13px] font-bold tracking-wide text-[#1a2b3c]">
                      {stage.label}{" "}
                      <span className="font-normal text-[#8a9bab]">
                        {items.length}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8a9bab]">
                      {totals.shown} | {totals.pot}
                    </p>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-2">
                    {items.map((deal) => (
                      <article
                        key={deal.id}
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("text/deal-id", deal.id)
                        }
                        className="cursor-grab rounded-md border border-[#dbe4eb] bg-white p-3 shadow-sm active:cursor-grabbing"
                      >
                        <p className="text-[13px] font-semibold text-[#1a2b3c]">
                          {deal.title}
                        </p>
                        <p className="mt-1 text-[12px] text-[#3498d8]">
                          {deal.address}
                        </p>
                        <p className="mt-1 text-[12px] font-semibold text-[#1a2b3c]">
                          {deal.price}
                        </p>
                        <p className="mt-2 text-[11px] text-[#8a9bab]">
                          {deal.client}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {STAGES.filter((s) => s.id !== deal.stage).map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => moveDeal(deal.id, s.id)}
                              className="rounded border border-[#dbe4eb] px-1.5 py-0.5 text-[10px] text-[#5a6f82] hover:border-[#00aeb6] hover:text-[#00aeb6]"
                            >
                              → {s.label.split(" ")[0]}
                            </button>
                          ))}
                        </div>
                      </article>
                    ))}
                    {items.length === 0 && (
                      <p className="px-2 py-6 text-center text-[12px] text-[#b0bec5]">
                        Drop deals here
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
