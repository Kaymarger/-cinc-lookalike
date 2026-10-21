"use client";

import { useMemo, useState } from "react";
import { estimateMonthlyPayment, formatPrice } from "@/lib/search";

export function StandaloneMortgageCalculator() {
  const [price, setPrice] = useState(1_200_000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(4.79);
  const [years, setYears] = useState(25);

  const down = Math.round((price * downPct) / 100);
  const loan = Math.max(0, price - down);
  const monthly = useMemo(
    () =>
      estimateMonthlyPayment(price, {
        downPct,
        annualRate: rate,
        years,
      }),
    [price, downPct, rate, years]
  );

  return (
    <div className="border border-[#e5e5e5] bg-white p-6 sm:p-8">
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#222]">
        Mortgage Payment Calculator
      </h2>
      <p className="mt-1 text-sm text-[#666]">
        Estimate a monthly payment for any purchase price. Rough Canadian demo
        rates — not a lender quote.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2 text-sm">
          <span className="text-[#666]">Home price</span>
          <input
            type="number"
            min={100000}
            step={10000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
            className="h-11 w-full border border-[#ddd] px-3 outline-none focus:border-[var(--cedar)]"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-[#666]">Down payment ({downPct}%)</span>
          <input
            type="range"
            min={5}
            max={40}
            step={1}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="w-full accent-[var(--cedar)]"
          />
          <span className="font-medium text-[#222]">{formatPrice(down)}</span>
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-[#666]">Interest rate (%)</span>
          <input
            type="number"
            min={0}
            max={15}
            step={0.01}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value) || 0)}
            className="h-11 w-full border border-[#ddd] px-3 outline-none focus:border-[var(--cedar)]"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-[#666]">Amortization</span>
          <select
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="h-11 w-full border border-[#ddd] px-3 outline-none focus:border-[var(--cedar)]"
          >
            {[15, 20, 25, 30].map((y) => (
              <option key={y} value={y}>
                {y} years
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-[#eee] pt-6">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#888]">
            Est. monthly payment
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--cedar)]">
            {formatPrice(Math.round(monthly))}
          </p>
        </div>
        <p className="text-sm text-[#666]">
          Mortgage amount {formatPrice(loan)}
        </p>
      </div>
    </div>
  );
}
