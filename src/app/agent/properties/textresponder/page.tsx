"use client";

import { useEffect, useState } from "react";

type Campaign = { id: string; name: string; status: string; sent: number };

const KEY = "gvhs-text-campaigns";

export default function TextResponderPage() {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setRows(raw ? (JSON.parse(raw) as Campaign[]) : []);
    } catch {
      setRows([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(rows));
  }, [rows, ready]);

  return (
    <div className="p-4">
      <div className="mb-4 rounded border border-[#dbe4eb] bg-white p-4">
        <p className="text-[12px] font-semibold uppercase text-[#8a9bab]">Texting number</p>
        <p className="mt-1 text-[18px] text-[#1a2b3c]">(604) 363-7858</p>
        <p className="mt-1 text-[12px] text-[#5a6f82]">Sample number for this demo. Messages stay on this device.</p>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setNotice("Templates opened. Add a campaign below or use Inbox templates.")} className="rounded border border-[#00aeb6] px-3 py-1.5 text-[12px] font-semibold text-[#00aeb6]">
          Templates
        </button>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            setRows((prev) => [{ id: `c-${Date.now()}`, name: name.trim(), status: "Draft", sent: 0 }, ...prev]);
            setName("");
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" className="h-8 rounded border border-[#dbe4eb] px-2 text-[12px]" />
          <button type="submit" className="h-8 rounded bg-[#00aeb6] px-3 text-[12px] font-semibold text-white">New Campaign</button>
        </form>
      </div>
      {notice && <p className="mb-2 text-[12px] text-[#1e8449]">{notice}</p>}
      <table className="w-full border-collapse bg-white text-left text-[13px]">
        <thead className="bg-[#e8f1f8] text-[11px] uppercase text-[#5a6f82]">
          <tr>
            <th className="px-3 py-2">Campaign</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Sent</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-[#8a9bab]">No campaigns yet.</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[#e8eef3]">
              <td className="px-3 py-2">{row.name}</td>
              <td className="px-3 py-2">{row.status}</td>
              <td className="px-3 py-2">{row.sent}</td>
              <td className="px-3 py-2 text-right">
                <button type="button" className="text-[12px] text-[#00aeb6]" onClick={() => setRows((prev) => prev.map((item) => item.id === row.id ? { ...item, status: "Sent", sent: item.sent + 1 } : item))}>
                  Send sample
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
