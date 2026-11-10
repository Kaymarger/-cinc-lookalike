"use client";

import { useEffect, useState } from "react";

type Section = { id: string; name: string; show: boolean; body?: string };

export function PublicPageSections({ page }: { page: "home" | "about" }) {
  const [sections, setSections] = useState<Section[]>([]);
  useEffect(() => {
    void fetch("/api/site/content", { cache: "no-store" }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { pages?: Record<string, { sections?: Section[] }> } | null;
      setSections(data?.pages?.[page]?.sections?.filter((section) => section.show) ?? []);
    });
  }, [page]);
  if (!sections.length) return null;
  return (
    <section className="mx-auto max-w-[1100px] px-4 py-10">
      {sections.map((section) => (
        <article key={section.id} className="mb-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#222]">{section.name}</h2>
          {section.body ? <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#444]">{section.body}</p> : null}
        </article>
      ))}
    </section>
  );
}
