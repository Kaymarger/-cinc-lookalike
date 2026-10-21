import { SITE } from "@/lib/site";

export function PageAssist() {
  return (
    <p className="text-center text-sm text-[#666]">
      If you need assistance, please call{" "}
      <a href={`tel:${SITE.phoneTel}`} className="text-[var(--cedar)] hover:underline">
        {SITE.phoneDisplay}
      </a>
    </p>
  );
}
