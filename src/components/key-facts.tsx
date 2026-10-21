import { listingKeyFacts, formatPrice } from "@/lib/search";
import type { Property } from "@/lib/types";

export function KeyFacts({ property }: { property: Property }) {
  const facts = listingKeyFacts(property);
  const items = [
    {
      label: "Days on market",
      value:
        facts.daysOnMarket === 0
          ? "Today"
          : String(facts.daysOnMarket),
    },
    {
      label: "$ / SqFt",
      value: formatPrice(facts.pricePerSqft),
    },
    {
      label: "Est. annual tax",
      value: formatPrice(facts.annualTax),
    },
    ...(facts.strataFee != null
      ? [
          {
            label: "Est. strata / mo",
            value: formatPrice(facts.strataFee),
          },
        ]
      : []),
    {
      label: "Parking",
      value: facts.parking,
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="bg-white px-4 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {item.label}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-lg text-[var(--cedar-deep)]">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
