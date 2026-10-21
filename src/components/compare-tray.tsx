"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useCompare } from "@/lib/compare";
import { getPropertyById, formatPrice } from "@/lib/search";

export function CompareTray() {
  const { ready, ids, remove, clear, max } = useCompare();
  if (!ready || ids.length === 0) return null;

  const homes = ids
    .map((id) => getPropertyById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-white shadow-[0_-8px_30px_rgba(4,66,125,0.12)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <p className="shrink-0 text-sm font-medium text-[var(--ink)]">
          Compare ({homes.length}/{max})
        </p>
        <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto">
          {homes.map((home) => (
            <div
              key={home.id}
              className="flex min-w-[180px] items-center gap-2 rounded-sm border border-border bg-[var(--fog)] p-1.5"
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-sm bg-[var(--mist)]">
                <Image
                  src={home.images[0]}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-[var(--ink)]">
                  {home.address}
                </p>
                <p className="text-xs text-[var(--cedar-deep)]">
                  {formatPrice(home.price)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${home.address}`}
                onClick={() => remove(home.id)}
                className="inline-flex size-7 items-center justify-center rounded-sm text-[var(--ink-muted)] hover:bg-black/5"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={clear}
            className="h-9 px-3 text-sm text-[var(--ink-muted)] hover:text-[var(--cedar)]"
          >
            Clear
          </button>
          <Link
            href="/compare"
            className="inline-flex h-9 items-center rounded-sm bg-[var(--cedar)] px-4 text-sm font-medium text-white hover:brightness-95"
          >
            Compare now
          </Link>
        </div>
      </div>
    </div>
  );
}
