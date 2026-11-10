"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChromeContext } from "./chrome-context";
import { useOfficeSession } from "./office-session";
import { useLeads } from "@/lib/leads";
import { href, sectionOf, titleMenu, titleOf, type CincRoute, type NavSection } from "./route";
const NAV: {
  id: NavSection;
  label: string;
  href: string;
  badge?: boolean;
  children?: { label: string; href: string; group?: boolean }[];
}[] = [
  {
    id: "launchpad",
    label: "Launchpad",
    href: href.launchpad,
    children: [
      { label: "Agent", href: href.launchpad },
      { label: "Broker", href: href.broker },
      { label: "Call Summary", href: href.call },
    ],
  },
  { id: "leads", label: "Leads", href: href.leads },
  { id: "deals", label: "Deals", href: href.dealsPurchases },
  {
    id: "contacts",
    label: "Contacts",
    href: href.contacts,
    children: [
      { label: "Vendors", href: href.contacts },
      { label: "Contacts", href: href.contactList },
    ],
  },
  {
    id: "comms",
    label: "Communications",
    href: href.inbox,
    children: [
      { label: "CINC Inbox", href: "", group: true },
      { label: "Inbox", href: href.inbox },
      { label: "Sent", href: href.sent },
      { label: "Drafts", href: href.drafts },
      { label: "Trashed", href: href.trashed },
      { label: "Gmail Inbox", href: href.gmail },
      { label: "Templates", href: href.templates },
    ],
  },
  {
    id: "auto",
    label: "Automations",
    href: href.autotracks,
    children: [
      { label: "AutoTracks", href: href.autotracks },
      { label: "Behavioral Messaging", href: href.behavioral },
      { label: "CINC AI", href: href.ai },
    ],
  },
  { id: "calendar", label: "Calendar", href: href.calendar },
  {
    id: "props",
    label: "Properties",
    href: href.properties,
    children: [
      { label: "Listings Dashboard", href: href.properties },
      { label: "Text Responder", href: href.textResponder },
      { label: "Upcoming Open Houses", href: href.openHouses },
      { label: "Virtual Open Houses", href: href.virtualOpenHouses },
    ],
  },
  {
    id: "web",
    label: "Website",
    href: "/dashboard/pages/home",
    children: [
      { label: "Page Editor", href: "/dashboard/spa#website/pages/home" },
      { label: "Seller Suite", href: href.seller },
      { label: "Landing Pages", href: href.landing },
      { label: "Theme Options", href: href.officeTheme },
    ],
  },
  {
    id: "agents",
    label: "Agents",
    href: href.agents,
    children: [
      { label: "Manage Agents", href: href.agents },
      { label: "Lead Routing", href: href.leadRouting },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    href: href.officeGeneral,
    children: [
      { label: "General", href: href.officeGeneral },
      { label: "Search", href: href.officeSearch },
      { label: "Profile", href: href.profile },
      { label: "Dialer", href: href.officeDialer },
      { label: "Custom Fields", href: href.officeFields },
      { label: "Billing & Invoices", href: href.officeBilling },
    ],
  },
  { id: "marketing", label: "Marketing Dashboard", href: href.marketing },
];

function childOn(label: string, route: CincRoute) {
  if (label === "Agent") return route.view === "launchpad";
  if (label === "Broker") return route.view === "broker";
  if (label === "Call Summary") return route.view === "callsummary";
  if (label === "Vendors") return route.view === "contacts" && route.mode === "vendors";
  if (label === "Contacts") return route.view === "contacts" && route.mode === "people";
  if (label === "Gmail Inbox") return route.view === "gmail";
  if (label === "Manage Agents") return route.view === "users" && route.mode === "manage";
  if (label === "Lead Routing") return route.view === "users" && route.mode === "routing";
  if (label === "General") return route.view === "settings" && route.tab === "general";
  if (label === "Search") return route.view === "settings" && route.tab === "searchpage";
  if (label === "Profile") return route.view === "settings" && (route.tab === "profile" || route.tab === "settings" || route.tab === "integrations" || route.tab === "advanced" || route.tab === "notifications" || route.tab === "customlinks");
  if (label === "Dialer") return route.view === "settings" && route.tab === "dialer";
  if (label === "Custom Fields") return route.view === "settings" && route.tab === "fields";
  if (label === "Billing & Invoices") return route.view === "settings" && route.tab === "billing";
  if (label === "Theme Options") return route.view === "settings" && route.tab === "theme";
  if (label === "Page Editor") return route.view === "website";
  if (label === "Seller Suite") return route.view === "seller";
  if (label === "Landing Pages") return route.view === "landing";
  if (label === "Listings Dashboard") return route.view === "properties" && (route.sub === "list" || route.sub === "add");
  if (route.view === "inbox") {
    if (label === "Inbox") return route.folder === "inbox";
    if (label === "Sent") return route.folder === "sent";
    if (label === "Drafts") return route.folder === "drafts";
    if (label === "Trashed") return route.folder === "trashed";
    if (label === "Templates") return route.folder === "templates";
  }
  if (label === "AutoTracks") return route.view === "autotracks";
  if (label === "Behavioral Messaging") return route.view === "behavioral";
  if (label === "CINC AI") return route.view === "ai";
  if (route.view === "properties") {
    if (label === "Properties") return route.sub === "list" || route.sub === "add";
    if (label === "Text Responder") return route.sub === "text";
    if (label === "Upcoming Open Houses") return route.sub === "open";
    if (label === "Virtual Open Houses") return route.sub === "virtual";
  }
  if (label === "Seller Suite") return route.view === "seller";
  if (route.view === "landing") {
    if (label === "Landing Pages") return route.category === "all";
    if (label === "Buyers Pages") return route.category === "buyers";
    if (label === "Sellers Pages") return route.category === "sellers";
    if (label === "Contact Pages") return route.category === "contact";
  }
  return false;
}

function SubIcon({ label }: { label: string }) {
  const common = "h-3 w-3 shrink-0";
  if (label === "Inbox") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M2 3h12v8H2zM2 8h3l1 2h4l1-2h3" />
      </svg>
    );
  }
  if (label === "Sent") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M2 8 14 2 9 14l-1.5-4.5L2 8z" />
      </svg>
    );
  }
  if (label === "Drafts") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 13h7l3-3V3H3v10zM10 13v-3h3" />
      </svg>
    );
  }
  if (label === "Trashed") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 4h10M6 4V3h4v1M5 4l.6 9h4.8L11 4" />
      </svg>
    );
  }
  return null;
}

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-[3px] bg-[#329bb9] text-[16px] font-semibold text-white">A</span>
      <span className="text-[18px] leading-none font-semibold tracking-tight text-white">AREG</span>
    </span>
  );
}

function NavIcon({ id }: { id: NavSection }) {
  const common = "h-6 w-6";
  if (id === "launchpad") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M2 12V7l6-4 6 4v5" />
        <path d="M6 12V8h4v4" />
      </svg>
    );
  }
  if (id === "leads") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="8" cy="5" r="2.2" />
        <path d="M3.5 13c.6-2.2 2.2-3.2 4.5-3.2S12 10.8 12.5 13" />
      </svg>
    );
  }
  if (id === "deals") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="2" y="3" width="12" height="10" rx="1" />
        <path d="M2 6h12M6 6v7" />
      </svg>
    );
  }
  if (id === "contacts") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="6" cy="6" r="2" />
        <path d="M2.5 13c.5-2 1.8-3 3.5-3s3 1 3.5 3" />
        <circle cx="11" cy="6.5" r="1.5" />
        <path d="M10 13c.3-1.3 1-2 2-2" />
      </svg>
    );
  }
  if (id === "agents") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="8" cy="5" r="2" />
        <path d="M3.5 13c.6-2.2 2.2-3.2 4.5-3.2S12 10.8 12.5 13" />
        <path d="M11 3.2h3M12.5 1.7v3" />
      </svg>
    );
  }
  if (id === "marketing") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M2 10V6l9-3v10L2 10z" />
        <path d="M11 6.5c1.2.4 2 1.2 2 2s-.8 1.6-2 2" />
      </svg>
    );
  }
  if (id === "settings") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="8" cy="8" r="2" />
        <path d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" />
      </svg>
    );
  }
  if (id === "comms") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M2 3h12v8H5l-3 2V3z" />
      </svg>
    );
  }
  if (id === "auto") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M8 2.5v3M8 10.5v3M2.5 8h3M10.5 8h3" />
        <circle cx="8" cy="8" r="2" />
      </svg>
    );
  }
  if (id === "props") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M2 7.5 8 3l6 4.5V13H2V7.5z" />
      </svg>
    );
  }
  if (id === "calendar") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="2" y="3" width="12" height="11" />
        <path d="M2 6h12M5 2v2M11 2v2" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="8" r="5.2" />
      <path d="M3 8h10M8 3c1.6 1.6 1.6 8.4 0 10M8 3c-1.6 1.6-1.6 8.4 0 10" />
    </svg>
  );
}

function TitleIcon({ label }: { label: string }) {
  const common = "h-4 w-4 shrink-0 text-[#1c93b5]";
  if (label.includes("Export")) {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 13h10M8 2v8M5 7l3 3 3-3" />
      </svg>
    );
  }
  if (label.includes("Dialer") || label.includes("Call")) {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M4 3h2l1 3-1.5 1a7 7 0 0 0 3.5 3.5L10 9l3 1v2a1 1 0 0 1-1 1A9 9 0 0 1 3 4a1 1 0 0 1 1-1z" />
      </svg>
    );
  }
  if (label.includes("Text")) {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 3h10v8H6l-3 2z" />
      </svg>
    );
  }
  if (label.includes("Open") || label.includes("Virtual")) {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M2 7 8 3l6 4v6H2z" />
      </svg>
    );
  }
  if (label.includes("Launchpad") || label.includes("Agent")) {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="8" cy="6" r="2.2" />
        <path d="M3.5 13c.6-2 2.2-3 4.5-3s3.9 1 4.5 3" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 4h10v8H3z" />
    </svg>
  );
}

const ROSTER = [
  ["Casey Archibald", "Agent"],
  ["Kayla Gerak", "Agent"],
  ["Anastasiia Borovyk", "Agent"],
  ["Kevin Barrett", "Broker"],
];

export function Shell({ route, children }: { route: CincRoute; children: ReactNode }) {
  const office = useOfficeSession();
  const section = sectionOf(route);
  const menu = titleMenu(route);
  const [titleOpen, setTitleOpen] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [rail, setRail] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [feed, setFeed] = useState("All");
  const { leads } = useLeads();
  const activities = leads
    .flatMap((lead) => (lead.activity ?? []).map((item) => ({ ...item, leadId: lead.id, leadName: lead.name })))
    .filter((item) => {
      if (feed === "Notes") return item.kind === "note";
      if (feed === "Agent Actions") return item.kind === "call" || item.kind === "task" || item.kind === "system";
      if (feed === "Communications") return item.kind === "email" || item.kind === "text";
      if (feed === "Views & Favorites") return item.kind === "signup";
      return true;
    })
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 20);
  function activityWhen(at: string) {
    const date = new Date(at);
    if (Number.isNaN(date.getTime())) return at;
    return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }
  function activityTitle(title: string) {
    if (title === "Free Access signup") return "Signed up for home search";
    if (title === "Lead captured") return "Sent a message";
    return title;
  }
  const [modal, setModal] = useState<ReactNode>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [message]);

  const routeKey = JSON.stringify(route);
  useEffect(() => {
    document.title = `${titleOf(route) || "CINC"} · CINC`;
    setModal(null);
    setNavOpen(false);
  }, [routeKey]);

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setRail(false);
  }, []);

  useEffect(() => {
    if (!titleOpen) return;
    const close = (event: MouseEvent) => {
      if (!titleRef.current?.contains(event.target as Node)) setTitleOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [titleOpen]);

  const api = useMemo(
    () => ({
      leadSearch,
      setLeadSearch,
      searchOpen,
      setSearchOpen,
      rail,
      setRail,
      toast: (value: string) => setMessage(value),
      openModal: (node: ReactNode) => setModal(node),
      closeModal: () => setModal(null),
    }),
    [leadSearch, searchOpen, rail],
  );

  const showSearch = route.view === "leads" || route.view === "inbox" || route.view === "autotracks" || route.view === "behavioral" || route.view === "ai" || route.view === "properties" || route.view === "landing";

  return (
    <ChromeContext.Provider value={api}>
      <div className={`cinc-root relative flex overflow-hidden bg-[#f5f5f5] font-[family-name:var(--font-sans)] text-[13px] text-[#333] ${office.impersonating ? "mt-10 h-[calc(100vh-2.5rem)]" : "h-screen"}`}>
        <aside className={`flex w-[220px] shrink-0 flex-col bg-[#2d3e4c] text-white max-md:fixed max-md:inset-y-0 max-md:z-40 max-md:transition-transform ${navOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"}`}>
          <div className="flex h-[60px] items-center bg-[#24313c] px-4">
            <Logo />
          </div>
          <nav className="pt-1" onClick={() => setNavOpen(false)}>
            {NAV.map((item) => {
              const active = section === item.id;
              const kids = item.children ?? [];
              return (
                <div key={item.id}>
                  <a
                    href={item.href}
                    className={`flex h-[46px] items-center gap-3 px-4 text-[14px] whitespace-nowrap ${active ? "bg-[#263644] text-[#329bb9]" : "text-[#f4f7f8] hover:bg-[#36485a]"}`}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center">
                      <NavIcon id={item.id} />
                    </span>
                    <span>{item.label}</span>
                  </a>
                  {active && kids.length ? (
                    <div className="bg-[#24313c] py-1">
                      {kids.map((child) => {
                        if (child.group || !child.href) {
                          return <p key={child.label} className="px-5 py-1 text-[11px] font-bold text-[#9fd7ea]">{child.label}</p>;
                        }
                        const on = childOn(child.label, route);
                        return (
                          <a key={child.label} href={child.href} className={`flex h-9 items-center gap-2 pr-1 pl-8 text-[13px] whitespace-nowrap ${on ? "text-[#329bb9]" : "text-[#d5dde1] hover:text-white"}`} onClick={() => { if (child.label === "Agent") window.dispatchEvent(new Event("cinc-launchpad-home")); }}>
                            {item.id === "comms" && child.label !== "Templates" ? <SubIcon label={child.label} /> : <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${on ? "bg-[#329bb9]" : "border border-[#8aa] bg-transparent"}`} />}
                            {child.label}
                          </a>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="relative z-50 flex h-[60px] shrink-0 items-center gap-3 border-b border-[#e6e6e6] bg-white pr-4 pl-5">
            <button
              type="button"
              className="grid h-11 w-11 place-items-center text-[#2d3c4b] md:hidden"
              aria-label={navOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={navOpen}
              onClick={() => setNavOpen((value) => !value)}
            >
              <svg className="h-5 w-5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M2 4h12M2 8h12M2 12h12" />
              </svg>
            </button>
            <div className="relative" ref={titleRef}>
              <button
                type="button"
                className="flex items-center gap-2 text-[22px] leading-none font-light text-[#329bb9]"
                onClick={() => menu.length && setTitleOpen((value) => !value)}
              >
                <span>{titleOf(route)}</span>
                {menu.length ? (
                  <svg width="12" height="10" viewBox="0 0 12 10" className="mt-1 text-[#2a9bb8]" aria-hidden>
                    <path d="M0 0h12L6 10z" fill="currentColor" />
                  </svg>
                ) : null}
              </button>
              {titleOpen && menu.length ? (
                <div className="absolute top-[calc(100%+10px)] left-0 z-50 w-max min-w-[240px] bg-white py-2 shadow-[0_8px_24px_rgba(15,23,28,0.16)]">
                  {menu.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-[10px] text-[15px] leading-5 font-normal text-[#2c2c2c] hover:bg-[#f5f5f5]"
                      onClick={() => setTitleOpen(false)}
                    >
                      <TitleIcon label={item.label} />
                      {item.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="ml-auto flex items-center gap-3">
              {office.impersonating ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-[2px] bg-[#d9363e] px-1.5 py-[3px] text-[10px] leading-none font-semibold tracking-wide text-white uppercase"
                  title="Stop viewing the office as this user"
                  onClick={office.endImpersonation}
                >
                  End Become User
                </button>
              ) : null}
              <button type="button" className="grid h-8 w-8 place-items-center text-[#4aa8c8]" aria-label="Search" onClick={() => setSearchOpen((value) => !value)}>
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="7" cy="7" r="4.2" /><path d="M10.5 10.5 14 14" /></svg>
              </button>
              {searchOpen ? <input className="h-7 w-40 border border-[#d5e8ee] px-2 text-[12px]" placeholder="Search leads" value={leadSearch} onChange={(event) => setLeadSearch(event.target.value)} onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                const q = leadSearch.trim().toLowerCase();
                if (!q) return;
                const digits = q.replace(/\D/g, "");
                const match = leads.find((lead) => lead.email.toLowerCase() === q || lead.name.toLowerCase() === q || (digits.length >= 7 && lead.phone.replace(/\D/g, "").includes(digits)));
                if (!match) { setMessage("No lead matches that search."); return; }
                window.location.href = href.lead(match.id);
              }} /> : null}
              <a href={href.marketing} className="text-[11px] font-semibold tracking-wide text-[#1b9cb8] uppercase">Get Leads</a>
              <button type="button" className="text-[11px] font-semibold tracking-wide text-[#1b9cb8] uppercase" onClick={() => setHelpOpen(true)}>
                Help
              </button>
              <div className="relative">
                <button type="button" className="flex items-center gap-1 text-[11px] font-medium text-[#333]" onClick={() => setAccountOpen((value) => !value)} title="Region">
                  <span>CA</span>
                  <svg width="7" height="5" viewBox="0 0 8 6" aria-hidden><path d="M0 0h8L4 6z" fill="#666" /></svg>
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                    <circle cx="8" cy="8" r="5.2" />
                    <path d="M3 8h10M8 3c1.6 1.6 1.6 8.4 0 10M8 3c-1.6 1.6-1.6 8.4 0 10" />
                  </svg>
                </button>
                {accountOpen ? (
                  <div className="absolute top-9 right-0 z-40 w-48 border border-[#e5e5e5] bg-white py-1 shadow-md" onMouseLeave={() => setAccountOpen(false)}>
                    <p className="px-3 py-2 text-[13px] text-[#1c93b5]">{office.user?.name || "Account"}</p>
                    <a href={href.profile} className="block px-3 py-2 text-[13px] hover:bg-[#f6f6f6]">Profile & Settings</a>
                    {office.user && (office.user.role === "admin" || office.user.role === "broker") ? (
                      <a href={href.agents} className="block px-3 py-2 text-[13px] hover:bg-[#f6f6f6]">Agents</a>
                    ) : null}
                    <a href={href.publicSite} className="block px-3 py-2 text-[13px] hover:bg-[#f6f6f6]">Public Website</a>
                    <form action="/api/agent/logout" method="post">
                      <button type="submit" className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f6f6f6]">
                        Log out
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                title="Show the full sidebar"
                className={`grid h-8 w-8 place-items-center ${rail ? "text-[#1c93b5]" : "text-[#666]"}`}
                onClick={() => setRail((value) => !value)}
              >
                <svg className="h-[18px] w-[18px]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" />
                </svg>
              </button>
            </div>
          </header>
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 overflow-auto">{children}</main>
            {rail && route.view !== "website" && route.view !== "settings" && route.view !== "seller" && route.view !== "landing" && route.view !== "leadsearch" ? (
              <aside className="flex w-[220px] shrink-0 flex-col border-l border-[#e5e5e5] bg-[#f4f4f4]">
                <div className="border-b-2 border-[#1c93b5] bg-white px-3 py-2 text-[13px] font-semibold text-[#1c93b5]">Activity</div>
                <label className="px-2 py-2">
                  <select className="h-7 w-full border border-[#ccc] bg-white text-[12px]" value={feed} onChange={(event) => setFeed(event.target.value)}>
                    {["All", "Notes", "Views & Favorites", "Agent Actions", "Communications"].map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <div className="min-h-0 flex-1 overflow-auto px-2 [scrollbar-color:#c5c5c5_transparent]">
                  {activities.length ? activities.map((item) => (
                    <a key={`${item.leadId}-${item.id}`} href={href.lead(item.leadId)} className="mb-2 block border border-[#e5e5e5] bg-white px-2 py-1.5 text-[12px] hover:border-[#1c93b5]">
                      <span className="font-semibold text-[#1c93b5]">{item.leadName}</span>
                      <span className="mt-0.5 block text-[#333]">{activityTitle(item.title)}</span>
                      <span className="text-[11px] text-[#888]">{activityWhen(item.at)}</span>
                    </a>
                  )) : <p className="px-1 py-6 text-center text-[12px] text-[#888]">No new activities</p>}
                </div>
                <div className="border-t border-[#e5e5e5] bg-white">
                  <p className="px-2 py-1 text-[10px] font-bold tracking-wide text-[#888] uppercase">Online</p>
                  {ROSTER.map(([name, role]) => (
                    <a key={name} href={href.dialer} className="flex items-center gap-1 px-2 py-1 text-[12px] text-[#1c93b5] hover:bg-[#f3fafc]">
                      <span className="min-w-0 flex-1 truncate">{name}</span>
                      <span className="text-[10px] text-[#999]">({role})</span>
                      <span className="h-[6px] w-[6px] rounded-full bg-[#2e9e5b]" />
                    </a>
                  ))}
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>
      {modal}
      {helpOpen ? (
        <div className="fixed top-[52px] right-16 z-[70] w-56 border border-[#e5e5e5] bg-white py-1 text-[13px] shadow-lg">
          <a className="block px-3 py-2 hover:bg-[#f6f6f6]" href="https://support.cincpro.com" target="_blank" rel="noreferrer">Help Center</a>
          <a className="block px-3 py-2 hover:bg-[#f6f6f6]" href={href.contact}>Contact Support</a>
          <a className="block px-3 py-2 hover:bg-[#f6f6f6]" href={href.faq}>What&apos;s New</a>
          <button type="button" className="block w-full px-3 py-2 text-left hover:bg-[#f6f6f6]" onClick={() => setHelpOpen(false)}>Close</button>
        </div>
      ) : null}
      {navOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      ) : null}
      {message ? (
        <div role="status" aria-live="polite" className="fixed bottom-4 left-1/2 z-[90] max-w-[90vw] -translate-x-1/2 rounded bg-[#243238] px-4 py-3 text-[14px] text-white shadow-lg">
          {message}
        </div>
      ) : null}
    </ChromeContext.Provider>
  );
}
