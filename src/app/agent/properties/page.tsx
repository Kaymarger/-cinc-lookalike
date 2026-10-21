"use client";

import Image from "next/image";
import { Share2 } from "lucide-react";
import { CRM_PROPERTIES } from "@/lib/cinc-crm";

export default function PropertiesPage() {
  return (
    <div className="flex h-full min-h-[calc(100vh-3rem)] flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#dbe4eb] bg-white px-4 py-3">
        <button
          type="button"
          className="rounded bg-[#00aeb6] px-3 py-1.5 text-[12px] font-semibold text-white"
        >
          Show MLS Listings
        </button>
        <button
          type="button"
          className="rounded border border-[#00aeb6] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#00aeb6]"
        >
          Show Pocket Listings
        </button>
        <select className="rounded border border-[#00aeb6] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#00aeb6]">
          <option>My Office/Agents Listings</option>
        </select>
        <button
          type="button"
          className="ml-auto rounded bg-[#00aeb6] px-3 py-1.5 text-[12px] font-semibold text-white"
        >
          Advertise Listings
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
        <div className="overflow-hidden rounded-lg border border-[#dbe4eb] bg-white">
          <table className="w-full min-w-[800px] border-collapse text-left text-[13px]">
            <thead className="bg-[#e8f1f8] text-[11px] font-semibold uppercase tracking-wide text-[#5a6f82]">
              <tr>
                <th className="px-4 py-3">MLS Listing</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Feature</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {CRM_PROPERTIES.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-[#e8eef3] align-top hover:bg-[#f7fbfd]"
                >
                  <td className="px-4 py-4">
                    <div className="flex gap-3">
                      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded bg-[#dbe4eb]">
                        <Image
                          src={p.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="80px"
                          unoptimized
                        />
                      </div>
                      <div>
                        <p className="font-medium text-[#3498d8] hover:underline">
                          {p.address}
                        </p>
                        <p className="mt-0.5 text-[12px] text-[#5a6f82]">
                          {p.mls}
                        </p>
                        <p className="text-[12px] text-[#5a6f82]">
                          MLS Status: {p.status}
                        </p>
                        <button
                          type="button"
                          className="mt-1 text-[12px] text-[#3498d8] hover:underline"
                        >
                          Send Message
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[#1a2b3c]">{p.price}</p>
                    <p className="mt-0.5 text-[12px] text-[#5a6f82]">
                      {p.beds}bd | {p.baths}ba | {p.sqft.toLocaleString()} sqft
                    </p>
                    <p className="mt-1 text-[11px] text-[#8a9bab]">
                      Updated {p.updated}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-[#5a6f82]">{p.feature}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        className="rounded p-1 text-[#8a9bab] hover:bg-[#eef3f7]"
                        aria-label="Share"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded border border-[#3498d8] bg-white px-3 py-1.5 text-[12px] font-medium text-[#3498d8]"
                      >
                        Buyer Matches
                      </button>
                      <button
                        type="button"
                        className="rounded border border-[#3498d8] bg-white px-3 py-1.5 text-[12px] font-medium text-[#3498d8]"
                      >
                        Text Responder
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
