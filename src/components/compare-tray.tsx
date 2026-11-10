"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { X } from "lucide-react";
import { useCompare } from "@/lib/compare";
import { formatPrice } from "@/lib/search";

export function CompareTray() {
  const { ready, homes, notice, remove, clear, max } = useCompare();
  if (!ready || homes.length === 0) return null;
  const readyToCompare = homes.length >= 2;
  useEffect(() => {
    const previous = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "220px";
    return () => {
      document.body.style.paddingBottom = previous;
    };
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t-4 border-[#1976d2] bg-white shadow-[0_-8px_30px_rgba(4,66,125,0.16)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#1f2930]">
            Compare homes · {homes.length} of {max}
          </p>
          <p className="text-xs text-[#5a6f82]">
            {notice
              ? notice
              : readyToCompare
                ? "Open the comparison, or remove a home to choose another."
                : "Add one more home. You can compare 2 or 3. No account is required."}
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {homes.map((home) => (
            <div key={home.id} className="flex min-w-[220px] flex-1 items-center gap-2 rounded border border-[#d7e0e8] bg-[#f7fafc] p-2">
              <div className="relative size-12 shrink-0 overflow-hidden bg-[#7b97aa]">
                {home.image ? (
                  <Image src={home.image} alt="" fill className="object-cover" sizes="48px" unoptimized={home.image.startsWith("http") && !home.image.includes("ddfcdn.realtor.ca")} />
                ) : (
                  <span className="grid h-full place-items-center px-1 text-center text-[9px] text-white">No photo</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#1f2930]">{home.address}</p>
                <p className="text-xs text-[#1976d2]">{formatPrice(home.price)}</p>
              </div>
              <button type="button" aria-label={`Remove ${home.address}`} onClick={() => remove(home.id)} className="inline-flex size-8 items-center justify-center text-[#5a6f82]">
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={clear} className="h-11 px-3 text-sm font-semibold text-[#5a6f82]">
            Clear all
          </button>
          {readyToCompare ? (
            <Link href="/compare" className="inline-flex h-11 items-center justify-center bg-[#1976d2] px-5 text-sm font-bold text-white">
              Compare homes
            </Link>
          ) : (
            <span className="inline-flex h-11 items-center justify-center bg-[#d7e0e8] px-5 text-sm font-bold text-[#5a6f82]">
              Compare homes
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
