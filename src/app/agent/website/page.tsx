import Link from "next/link";

export default function WebsitePage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">
      <div className="rounded-lg border border-[#dbe4eb] bg-white p-6 shadow-sm">
        <h2 className="text-[18px] font-semibold text-[#1a2b3c]">Website</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#5a6f82]">
          Manage your consumer-facing IDX site from here. In this demo, the live
          lead site is linked below — branding, search, and registration stay on
          the public side.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded bg-[#00aeb6] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#009a9c]"
        >
          Open consumer site
        </Link>
      </div>
    </div>
  );
}
