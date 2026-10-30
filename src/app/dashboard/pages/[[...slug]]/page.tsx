"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyPageEditor() {
  const params = useParams<{ slug?: string[] }>();
  const router = useRouter();
  useEffect(() => {
    const slug = params.slug?.join("/") || "home";
    router.replace(`/dashboard/spa#website/pages/${slug}`);
  }, [params.slug, router]);
  return <p className="p-6 text-[13px] text-[#666]">Opening the page editor…</p>;
}
