"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/agent/settings/profile", label: "Profile" },
  { href: "/agent/settings/settings", label: "Settings" },
  { href: "/agent/settings/integrations", label: "Integrations" },
  { href: "/agent/settings/notifications", label: "Notifications" },
  { href: "/agent/settings/customlinks", label: "Custom Links" },
];

const KEY = "gvhs-cinc-settings";

type Store = {
  name: string;
  email: string;
  phone: string;
  subdomain: string;
  signature: string;
  toggles: Record<string, boolean>;
  links: { id: string; label: string; url: string }[];
};

const DEFAULTS: Store = {
  name: "Casey Archibald",
  email: "agent@example.com",
  phone: "(604) 363-7858",
  subdomain: "greatervancouverhomesearch",
  signature: "Casey Archibald · Archibald Real Estate Group",
  toggles: {
    leadText: true,
    plainEmail: false,
    chat: true,
    contactInfo: true,
    leadSummary: true,
    usageReport: false,
    propertyView: true,
    google: false,
    techConnect: false,
    contactApi: false,
    emailTracking: false,
  },
  links: [],
};

function useStore() {
  const [data, setData] = useState<Store>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      setData(DEFAULTS);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(data));
  }, [data, ready]);

  function update(patch: Partial<Store>) {
    setData((prev) => ({ ...prev, ...patch }));
    setSaved("Saved on this device.");
  }

  function toggle(id: string) {
    setData((prev) => ({ ...prev, toggles: { ...prev.toggles, [id]: !prev.toggles[id] } }));
    setSaved("Saved on this device.");
  }

  return { data, ready, saved, update, toggle, setSaved };
}

export function SettingsFrame({
  current,
  children,
}: {
  current: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap gap-2 border-b border-[#dbe4eb]">
        {TABS.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-3 py-2 text-[13px]",
              current === tab.label ? "border-b-2 border-[#00aeb6] font-semibold text-[#1a2b3c]" : "text-[#5a6f82]"
            )}
          >
            {tab.label}
          </a>
        ))}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-[12px] text-[#5a6f82]">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-9 w-full rounded border border-[#dbe4eb] px-2 text-[13px] text-[#1a2b3c]" />
    </label>
  );
}

export function ProfileSettings() {
  const store = useStore();
  return (
    <SettingsFrame current="Profile">
      <div className="grid max-w-[720px] gap-4">
        <section className="rounded border border-[#dbe4eb] bg-white p-4">
          <h2 className="text-[14px] font-semibold text-[#1a2b3c]">Login Info</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={store.data.name} onChange={(name) => store.update({ name })} />
            <Field label="Email" value={store.data.email} onChange={(email) => store.update({ email })} />
            <Field label="Phone" value={store.data.phone} onChange={(phone) => store.update({ phone })} />
          </div>
          <button type="button" className="mt-3 text-[12px] text-[#3498d8]" onClick={() => store.setSaved("Password recovery link copied (sample).")}>
            Send recovery link
          </button>
        </section>
        <section className="rounded border border-[#dbe4eb] bg-white p-4">
          <h2 className="text-[14px] font-semibold text-[#1a2b3c]">Site Subdomain</h2>
          <Field label="Subdomain" value={store.data.subdomain} onChange={(subdomain) => store.update({ subdomain })} />
        </section>
        <section className="rounded border border-[#dbe4eb] bg-white p-4">
          <h2 className="text-[14px] font-semibold text-[#1a2b3c]">Agent CINC Number</h2>
          <p className="mt-2 text-[13px] text-[#1a2b3c]">{store.data.phone}</p>
        </section>
        <section className="rounded border border-[#dbe4eb] bg-white p-4">
          <h2 className="text-[14px] font-semibold text-[#1a2b3c]">Signature</h2>
          <textarea value={store.data.signature} onChange={(e) => store.update({ signature: e.target.value })} rows={3} className="mt-2 w-full rounded border border-[#dbe4eb] px-2 py-2 text-[13px]" />
        </section>
        {store.saved && <p className="text-[12px] text-[#1e8449]">{store.saved}</p>}
      </div>
    </SettingsFrame>
  );
}

const SETTING_TOGGLES = [
  ["leadText", "Lead Text Alerts"],
  ["plainEmail", "Plain Text Emails"],
  ["chat", "Chat Notifications"],
  ["contactInfo", "Contact Info Notification"],
  ["leadSummary", "Receive Lead Summary"],
  ["usageReport", "User Usage Report"],
  ["propertyView", "Property View Report"],
] as const;

export function GeneralSettings() {
  const store = useStore();
  return (
    <SettingsFrame current="Settings">
      <div className="max-w-[640px] rounded border border-[#dbe4eb] bg-white">
        {SETTING_TOGGLES.map(([id, label]) => (
          <label key={id} className="flex items-center justify-between border-b border-[#e8eef3] px-4 py-3 text-[13px]">
            <span>{label}</span>
            <input type="checkbox" checked={Boolean(store.data.toggles[id])} onChange={() => store.toggle(id)} />
          </label>
        ))}
      </div>
      {store.saved && <p className="mt-3 text-[12px] text-[#1e8449]">{store.saved}</p>}
    </SettingsFrame>
  );
}

const INTEGRATIONS = [
  ["google", "Google"],
  ["techConnect", "Tech Connect"],
  ["contactApi", "Contact API"],
  ["emailTracking", "External Email Tracking"],
] as const;

export function IntegrationSettings() {
  const store = useStore();
  return (
    <SettingsFrame current="Integrations">
      <div className="grid max-w-[720px] gap-3">
        {INTEGRATIONS.map(([id, label]) => (
          <section key={id} className="flex items-center justify-between rounded border border-[#dbe4eb] bg-white px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold text-[#1a2b3c]">{label}</p>
              <p className="text-[12px] text-[#8a9bab]">{store.data.toggles[id] ? "Connected on this device" : "Not connected"}</p>
            </div>
            <button type="button" onClick={() => store.toggle(id)} className="rounded bg-[#00aeb6] px-3 py-1.5 text-[12px] font-semibold text-white">
              {store.data.toggles[id] ? "Disconnect" : "Connect"}
            </button>
          </section>
        ))}
        {store.saved && <p className="text-[12px] text-[#1e8449]">{store.saved}</p>}
      </div>
    </SettingsFrame>
  );
}

const ALERTS = ["New Leads", "Reminders", "New Note", "Request Showing", "New Task"];

export function NotificationSettings() {
  const store = useStore();
  return (
    <SettingsFrame current="Notifications">
      <div className="max-w-[760px] overflow-auto rounded border border-[#dbe4eb] bg-white">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#e8f1f8] text-[11px] uppercase text-[#5a6f82]">
            <tr>
              <th className="px-3 py-2">Alert</th>
              <th className="px-3 py-2">CINCAgent</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Text</th>
              <th className="px-3 py-2">Test</th>
            </tr>
          </thead>
          <tbody>
            {ALERTS.map((alert) => (
              <tr key={alert} className="border-t border-[#e8eef3]">
                <td className="px-3 py-2">{alert}</td>
                {["agent", "email", "text"].map((channel) => {
                  const id = `${alert}-${channel}`;
                  return (
                    <td key={channel} className="px-3 py-2">
                      <input type="checkbox" checked={store.data.toggles[id] !== false} onChange={() => store.toggle(id)} />
                    </td>
                  );
                })}
                <td className="px-3 py-2">
                  <button type="button" className="text-[12px] text-[#3498d8]" onClick={() => store.setSaved(`Test ${alert} recorded on this device.`)}>
                    TEST
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {store.saved && <p className="mt-3 text-[12px] text-[#1e8449]">{store.saved}</p>}
    </SettingsFrame>
  );
}

export function CustomLinkSettings() {
  const store = useStore();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  return (
    <SettingsFrame current="Custom Links">
      <div className="max-w-[640px] rounded border border-[#dbe4eb] bg-white p-4">
        <h2 className="text-[14px] font-semibold text-[#1a2b3c]">For my subdomain</h2>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!label.trim() || !url.trim()) return;
            store.update({
              links: [{ id: `${Date.now()}`, label: label.trim(), url: url.trim() }, ...store.data.links],
            });
            setLabel("");
            setUrl("");
          }}
        >
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" className="h-9 rounded border border-[#dbe4eb] px-2 text-[13px]" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="h-9 min-w-[180px] flex-1 rounded border border-[#dbe4eb] px-2 text-[13px]" />
          <button type="submit" className="h-9 rounded bg-[#00aeb6] px-3 text-[12px] font-semibold text-white">Create</button>
        </form>
        <ul className="mt-4 divide-y divide-[#e8eef3]">
          {store.data.links.length === 0 && <li className="py-4 text-[13px] text-[#8a9bab]">No custom links yet.</li>}
          {store.data.links.map((link) => (
            <li key={link.id} className="flex items-center gap-3 py-2 text-[13px]">
              <span className="font-medium">{link.label}</span>
              <span className="flex-1 truncate text-[#5a6f82]">{link.url}</span>
              <button type="button" className="text-[#e74c3c]" onClick={() => store.update({ links: store.data.links.filter((item) => item.id !== link.id) })}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        {store.saved && <p className="mt-3 text-[12px] text-[#1e8449]">{store.saved}</p>}
      </div>
    </SettingsFrame>
  );
}
