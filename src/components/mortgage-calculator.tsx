"use client";

import { useMemo, useState } from "react";
import { estimateMonthlyPayment, formatPrice } from "@/lib/search";

export function MortgageCalculator({ price }: { price: number }) {
  const [loan, setLoan] = useState(() => Math.round(price * 0.8));
  const [down, setDown] = useState(() => Math.round(price * 0.2));
  const [rate, setRate] = useState(4.79);
  const [years, setYears] = useState(25);
  const principal = Math.max(0, loan);
  const monthly = useMemo(
    () =>
      estimateMonthlyPayment(principal + Math.max(0, down), {
        downPct: principal + down > 0 ? (down / (principal + down)) * 100 : 0,
        annualRate: rate,
        years,
      }),
    [principal, down, rate, years]
  );

  return (
    <div className="border border-border bg-white p-6">
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--cedar-deep)]">
        Mortgage estimate
      </h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Rough payment only. This is not a lender quote.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-2 text-sm">
          <span className="text-[var(--ink-muted)]">Mortgage amount</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={loan}
            onChange={(e) => {
              const next = Math.max(0, Number(e.target.value) || 0);
              setLoan(next);
              setDown(Math.max(0, price - next));
            }}
            className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 outline-none focus:border-[var(--cedar)]"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-[var(--ink-muted)]">Down payment</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={down}
            onChange={(e) => {
              const next = Math.max(0, Number(e.target.value) || 0);
              setDown(next);
              setLoan(Math.max(0, price - next));
            }}
            className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 outline-none focus:border-[var(--cedar)]"
          />
          <span className="font-medium text-[var(--ink)]">{formatPrice(down)}</span>
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-[var(--ink-muted)]">Interest rate (%)</span>
          <input
            type="number"
            min={0}
            max={15}
            step={0.01}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value) || 0)}
            className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 outline-none focus:border-[var(--cedar)]"
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-[var(--ink-muted)]">Amortization</span>
          <select
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 outline-none focus:border-[var(--cedar)]"
          >
            {[15, 20, 25, 30].map((y) => (
              <option key={y} value={y}>
                {y} years
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Est. monthly payment
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--cedar-deep)]">
            {formatPrice(Math.round(monthly))}
          </p>
        </div>
        <p className="text-sm text-[var(--ink-muted)]">
          Mortgage amount {formatPrice(loan)}
        </p>
      </div>
    </div>
  );
}
