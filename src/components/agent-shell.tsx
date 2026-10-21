"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Gauge,
  Globe,
  House,
  Inbox,
  Laptop,
  Menu,
  Phone,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { CRM_AGENT, CRM_LEADS } from "@/lib/cinc-crm";
import { useCrmOverlay } from "@/lib/crm-overlay";
import { useLeads } from "@/lib/leads";
import { cn } from "@/lib/utils";

type NavChild = { href: string; label: string };
type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
  match?: (path: string) => boolean;
};

function AutoIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border border-current text-[10px] font-bold leading-none",
        className
      )}
    >
      A
    </span>
  );
}

const NAV: NavItem[] = [
  {
    href: "/agent/launchpad/agent",
    label: "Launchpad",
    icon: Gauge,
    children: [
      { href: "/agent/launchpad/agent", label: "Agent" },
      { href: "/agent/launchpad/dialersummary", label: "Call Summary" },
    ],
    match: (p) => p === "/agent" || p.startsWith("/agent/launchpad"),
  },
  {
    href: "/agent/leads",
    label: "Leads",
    icon: Users,
    match: (p) => p.startsWith("/agent/leads"),
  },
  {
    href: "/agent/deals/purchases",
    label: "Deals",
    icon: CircleDollarSign,
    children: [
      { href: "/agent/deals/purchases", label: "Purchases" },
      { href: "/agent/deals/listings", label: "Listings" },
    ],
    match: (p) => p.startsWith("/agent/deals") || p.startsWith("/agent/showings"),
  },
  {
    href: "/agent/inbox",
    label: "Communications",
    icon: Inbox,
    children: [
      { href: "/agent/inbox", label: "Inbox" },
      { href: "/agent/inbox/sent", label: "Sent" },
      { href: "/agent/inbox/drafts", label: "Drafts" },
      { href: "/agent/inbox/trashed", label: "Trashed" },
      { href: "/agent/inbox/templates", label: "Templates" },
    ],
    match: (p) => p.startsWith("/agent/inbox") || p.startsWith("/agent/communications"),
  },
  {
    href: "/agent/automations/autotracks",
    label: "Automations",
    icon: AutoIcon,
    children: [
      { href: "/agent/automations/autotracks", label: "AutoTracks" },
      { href: "/agent/automations/behavioralcomms", label: "Behavioral Messaging" },
      { href: "/agent/automations/ai", label: "CINC AI" },
    ],
    match: (p) => p.startsWith("/agent/automations"),
  },
  {
    href: "/agent/properties",
    label: "Properties",
    icon: House,
    children: [
      { href: "/agent/properties", label: "Properties" },
      { href: "/agent/properties/textresponder", label: "Text Responder" },
      { href: "/agent/properties/openhouses", label: "Upcoming Open Houses" },
      { href: "/agent/properties/virtualopenhouses", label: "Virtual Open Houses" },
    ],
    match: (p) => p.startsWith("/agent/properties") || p.startsWith("/agent/listings"),
  },
  {
    href: "/agent/sellersuite",
    label: "Website",
    icon: Laptop,
    children: [
      { href: "/agent/sellersuite", label: "Seller Suite" },
      { href: "/agent/landing", label: "Landing Pages" },
      { href: "/agent/landing/buyers", label: "Buyers" },
      { href: "/agent/landing/sellers", label: "Sellers" },
      { href: "/agent/landing/contact", label: "Contact" },
    ],
    match: (p) =>
      p.startsWith("/agent/sellersuite") ||
      p.startsWith("/agent/landing") ||
      p.startsWith("/agent/website"),
  },
  {
    href: "/agent/settings/profile",
    label: "Settings",
    icon: Settings,
    children: [
      { href: "/agent/settings/profile", label: "Profile" },
      { href: "/agent/settings/settings", label: "Settings" },
      { href: "/agent/settings/integrations", label: "Integrations" },
      { href: "/agent/settings/notifications", label: "Notifications" },
      { href: "/agent/settings/customlinks", label: "Custom Links" },
    ],
    match: (p) => p.startsWith("/agent/settings"),
  },
];

function AgentRail({
  tab,
  onTab,
  onClose,
}: {
  tab: "activity" | "dialer";
  onTab: (tab: "activity" | "dialer") => void;
  onClose?: () => void;
}) {
  const { leads, appendActivity } = useLeads();
  const overlay = useCrmOverlay();
  const [filter, setFilter] = useState("All");
  const [leadId, setLeadId] = useState("");
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState("");

  const events = [
    ...leads.flatMap((lead) =>
      (lead.activity ?? []).map((item) => ({
        id: item.id,
        who: lead.name,
        title: item.title,
        kind: item.kind,
        at: item.at,
      }))
    ),
    ...CRM_LEADS.flatMap((lead) =>
      [...(overlay.activity[lead.id] ?? []), ...lead.activity].map((item) => ({
        id: `${lead.id}-${item.id}`,
        who: lead.name,
        title: item.title,
        kind: item.kind,
        at: item.at,
      }))
    ),
  ].slice(0, 40);

  const shown = events.filter((event) => {
    if (filter === "Notes") return event.kind === "note";
    if (filter === "Views & Favorites") return event.kind === "inquiry" || event.kind === "system";
    if (filter === "Agent Actions") return event.kind === "task" || event.kind === "call";
    if (filter === "Communications") return event.kind === "text" || event.kind === "email" || event.kind === "call";
    return true;
  });

  const people = [
    ...leads.map((lead) => ({ id: lead.id, name: lead.name, origin: "site" as const })),
    ...CRM_LEADS.map((lead) => ({ id: lead.id, name: lead.name, origin: "crm" as const })),
  ];

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-[#dbe4eb] bg-white">
      <div className="flex border-b border-[#e8eef3]">
        {(["activity", "dialer"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onTab(id)}
            className={cn(
              "flex-1 py-2 text-[12px] font-semibold uppercase",
              tab === id ? "border-b-2 border-[#00aeb6] text-[#00aeb6]" : "text-[#8a9bab]"
            )}
          >
            {id === "activity" ? "Activity" : "Dialer"}
          </button>
        ))}
        <button type="button" className="px-2 text-[#8a9bab] xl:hidden" aria-label="Close side panel" onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
      </div>
      {tab === "activity" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-wrap gap-1 border-b border-[#e8eef3] p-2">
            {["All", "Notes", "Views & Favorites", "Agent Actions", "Communications"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cn(
                  "rounded px-2 py-1 text-[10px]",
                  filter === item ? "bg-[#102236] text-white" : "bg-[#f4f7f9] text-[#5a6f82]"
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <ul>
            {shown.map((event) => (
              <li key={event.id} className="border-b border-[#f0f4f8] px-3 py-2 text-[12px]">
                <p className="font-medium text-[#1a2b3c]">{event.title}</p>
                <p className="text-[#5a6f82]">{event.who}</p>
              </li>
            ))}
            {shown.length === 0 && <li className="px-3 py-6 text-center text-[12px] text-[#8a9bab]">No activity in this filter.</li>}
          </ul>
        </div>
      ) : (
        <form
          className="space-y-2 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const person = people.find((item) => item.id === leadId) ?? people[0];
            if (!person) return;
            const body = note.trim() || "Call from the side dialer";
            if (person.origin === "site") {
              appendActivity(person.id, { kind: "call", title: "Call logged", body });
            } else {
              overlay.appendActivity(person.id, { kind: "call", title: "Call logged", body });
            }
            setFlash(`Logged a call with ${person.name}.`);
            setNote("");
          }}
        >
          <label className="block text-[11px] text-[#5a6f82]">
            Lead
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="mt-1 h-8 w-full rounded border border-[#dbe4eb] px-2 text-[12px]"
            >
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Call note"
            className="w-full rounded border border-[#dbe4eb] px-2 py-1 text-[12px]"
          />
          <button type="submit" className="h-8 w-full rounded bg-[#00aeb6] text-[12px] font-semibold text-white">
            Log call
          </button>
          <Link href="/agent/dialer" className="block text-center text-[12px] text-[#3498d8]">
            Open full dialer
          </Link>
          {flash && <p className="text-[12px] text-[#1e8449]">{flash}</p>}
        </form>
      )}
    </aside>
  );
}

function CincLogo() {
  return (
    <Link href="/agent" className="flex items-center gap-2.5 px-4 py-4">
      <span className="grid h-7 w-7 grid-cols-2 grid-rows-2 gap-0.5 rounded-sm bg-[#1e88c9] p-1">
        <span className="rounded-[1px] bg-white/95" />
        <span className="rounded-[1px] bg-white/70" />
        <span className="rounded-[1px] bg-white/70" />
        <span className="rounded-[1px] bg-white/40" />
      </span>
      <span className="text-[22px] font-light tracking-wide text-white lowercase">
        cinc
      </span>
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-6 pt-1">
      {NAV.map((item) => {
        const active = item.match
          ? item.match(pathname)
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        const expanded = open[item.label] ?? active;
        const hasChildren = Boolean(item.children?.length);

        return (
          <div key={item.label}>
            <div className="relative">
              {active && (
                <span className="absolute inset-y-1 left-0 w-[3px] rounded-r bg-[#00aeb6]" />
              )}
              <Link
                href={item.href}
                onClick={() => {
                  if (hasChildren) {
                    setOpen((s) => ({ ...s, [item.label]: !expanded }));
                  }
                  onNavigate?.();
                }}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors",
                  active
                    ? "bg-[#00aeb6]/15 font-medium text-[#00d4d6]"
                    : "text-[#c5d0da] hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" />
                <span className="flex-1">{item.label}</span>
                {hasChildren &&
                  (expanded ? (
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  ))}
              </Link>
            </div>
            {hasChildren && expanded && (
              <div className="mb-1 ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                {item.children!.map((child, idx) => {
                  const isPrimary = idx === 0;
                  return (
                    <Link
                      key={child.label}
                      href={child.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2 rounded px-2 py-1.5 text-[12px] transition-colors",
                        active && isPrimary
                          ? "font-medium text-[#00d4d6]"
                          : "text-[#9aabba] hover:text-white"
                      )}
                    >
                      {active && isPrimary ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00aeb6]" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
                      )}
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

const PAGE_TITLES: { test: (p: string) => boolean; title: string }[] = [
  { test: (p) => p === "/agent" || p.startsWith("/agent/launchpad/agent"), title: "Agent Launchpad" },
  { test: (p) => p.startsWith("/agent/launchpad/dialersummary"), title: "Call Summary" },
  { test: (p) => p.startsWith("/agent/leads/export"), title: "Export Leads" },
  { test: (p) => p.startsWith("/agent/leads/dialer-history"), title: "Dialer History" },
  { test: (p) => p.startsWith("/agent/leads"), title: "Leads Dashboard" },
  { test: (p) => p.startsWith("/agent/deals"), title: "Deals Dashboard" },
  { test: (p) => p.startsWith("/agent/inbox") || p.startsWith("/agent/communications"), title: "Communication" },
  { test: (p) => p.startsWith("/agent/automations"), title: "Automations" },
  { test: (p) => p.startsWith("/agent/properties"), title: "Properties" },
  { test: (p) => p.startsWith("/agent/sellersuite") || p.startsWith("/agent/website"), title: "Seller Suite" },
  { test: (p) => p.startsWith("/agent/landing"), title: "Landing Pages" },
  { test: (p) => p.startsWith("/agent/settings"), title: "Settings" },
  { test: (p) => p.startsWith("/agent/plans"), title: "Plans" },
];

const LEAD_TITLE_LINKS = [
  { href: "/agent/leads/export", label: "Export Leads" },
  { href: "/agent/leads/dialer-history", label: "Dialer History" },
];

export function AgentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNav, setMobileNav] = useState(false);
  const [titleMenu, setTitleMenu] = useState(false);
  const [accountMenu, setAccountMenu] = useState(false);
  const [rail, setRail] = useState<"activity" | "dialer">("activity");
  const [mobileRail, setMobileRail] = useState(false);
  const title =
    PAGE_TITLES.find((t) => t.test(pathname))?.title ?? "Agent Workspace";
  const leadsTitle = title === "Leads Dashboard";

  return (
    <div className="flex min-h-full flex-1 bg-[#eef3f7] font-sans text-[#2c3e50]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 z-30 hidden h-screen w-[220px] shrink-0 flex-col bg-[#102236] lg:flex">
        <CincLogo />
        <p className="px-4 pb-3 text-[11px] text-[#7a8fa3]">
          {CRM_AGENT.name} · Demo
        </p>
        <SidebarNav />
        <div className="border-t border-white/10 px-4 py-3">
          <Link
            href="/"
            className="text-[11px] text-[#7a8fa3] underline-offset-2 hover:text-white hover:underline"
          >
            ← Consumer site
          </Link>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileNav(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[240px] flex-col bg-[#102236]">
            <div className="flex items-center justify-between pr-2">
              <CincLogo />
              <button
                type="button"
                onClick={() => setMobileNav(false)}
                className="rounded p-2 text-white/70 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setMobileNav(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-[#dbe4eb] bg-white px-3 sm:px-5">
          <button
            type="button"
            className="rounded p-1.5 text-[#5a6f82] hover:bg-[#eef3f7] lg:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative flex min-w-0 items-center gap-1.5">
            {leadsTitle ? (
              <button
                type="button"
                className="flex min-w-0 items-center gap-1 text-[17px] font-normal text-[#4aa3d9]"
                onClick={() => setTitleMenu((v) => !v)}
              >
                <span className="truncate">{title}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              </button>
            ) : (
              <h1 className="truncate text-[17px] font-normal text-[#4aa3d9]">{title}</h1>
            )}
            {titleMenu && leadsTitle && (
              <div className="absolute top-9 left-0 z-30 min-w-[180px] border border-[#dbe4eb] bg-white py-1 shadow-lg">
                {LEAD_TITLE_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setTitleMenu(false)}
                    className="block px-3 py-2 text-[13px] text-[#1a2b3c] hover:bg-[#f4f7f9]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/agent/leads"
              className="ml-1 rounded p-1 text-[#8a9bab] hover:bg-[#eef3f7]"
              aria-label="Search leads"
            >
              <Search className="h-4 w-4" />
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <Link
              href="/faq"
              className="hidden text-[12px] font-semibold tracking-wide text-[#00aeb6] sm:inline"
            >
              HELP
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenu((v) => !v)}
                className="flex items-center gap-1.5 text-[13px] text-[#5a6f82]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dce4ec] text-[11px] font-semibold text-[#3d5164]">
                  {CRM_AGENT.initials}
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 sm:block" />
              </button>
              {accountMenu && (
                <div className="absolute top-9 right-0 z-30 min-w-[190px] border border-[#dbe4eb] bg-white py-1 shadow-lg">
                  <Link href="/agent/plans" onClick={() => setAccountMenu(false)} className="block px-3 py-2 text-[13px] hover:bg-[#f4f7f9]">
                    Plans
                  </Link>
                  <Link href="/agent/settings/profile" onClick={() => setAccountMenu(false)} className="block px-3 py-2 text-[13px] hover:bg-[#f4f7f9]">
                    Profile & Settings
                  </Link>
                  <Link href="/" onClick={() => setAccountMenu(false)} className="block px-3 py-2 text-[13px] hover:bg-[#f4f7f9]">
                    Public Website
                  </Link>
                </div>
              )}
            </div>
            <Link href="/" className="hidden text-[#8a9bab] hover:text-[#5a6f82] sm:block" aria-label="Public website">
              <Globe className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="rounded p-1 text-[#8a9bab] hover:bg-[#eef3f7] xl:hidden"
              aria-label="Open activity and dialer"
              onClick={() => setMobileRail(true)}
            >
              <Phone className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</main>
          <div className="hidden xl:block">
            <AgentRail tab={rail} onTab={setRail} />
          </div>
          {mobileRail && (
            <div className="fixed inset-0 z-40 xl:hidden">
              <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close panel" onClick={() => setMobileRail(false)} />
              <div className="absolute top-12 right-0 bottom-0">
                <AgentRail tab={rail} onTab={setRail} onClose={() => setMobileRail(false)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
