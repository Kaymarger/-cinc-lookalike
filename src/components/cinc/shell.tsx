"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CRM_AGENT } from "@/lib/cinc-crm";
import { ChromeContext } from "./chrome-context";
import { href, sectionOf, titleMenu, titleOf, type CincRoute, type NavSection } from "./route";
import { Caret } from "./ui";

const NAV: {
  id: NavSection;
  label: string;
  href: string;
  dot?: boolean;
  children?: { label: string; href: string }[];
}[] = [
  {
    id: "launchpad",
    label: "Launchpad",
    href: href.launchpad,
    children: [
      { label: "Agent", href: href.launchpad },
      { label: "Call Summary", href: href.call },
    ],
  },
  { id: "leads", label: "Leads", href: href.leads, dot: true },
  {
    id: "deals",
    label: "Deals",
    href: href.dealsPurchases,
    children: [
      { label: "Purchases", href: href.dealsPurchases },
      { label: "Listings", href: href.dealsListings },
    ],
  },
  {
    id: "comms",
    label: "Communications",
    href: href.inbox,
    dot: true,
    children: [
      { label: "Inbox", href: href.inbox },
      { label: "Sent", href: href.sent },
      { label: "Drafts", href: href.drafts },
      { label: "Trashed", href: href.trashed },
      { label: "Templates", href: href.templates },
    ],
  },
  {
    id: "auto",
    label: "Automations",
    href: href.autotracks,
    children: [
      { label: "AutoTracks", href: href.autotracks },
      { label: "Behavioral Comms", href: href.behavioral },
      { label: "CINC AI", href: href.ai },
    ],
  },
  {
    id: "props",
    label: "Properties",
    href: href.properties,
    children: [
      { label: "Properties", href: href.properties },
      { label: "Text Responder", href: href.textResponder },
      { label: "Upcoming Open Houses", href: href.openHouses },
      { label: "Virtual Open Houses", href: href.virtualOpenHouses },
    ],
  },
  {
    id: "web",
    label: "Website",
    href: href.seller,
    children: [
      { label: "Seller Suite", href: href.seller },
      { label: "Landing Pages", href: href.landing },
    ],
  },
];

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="grid grid-cols-2 gap-[2px]">
        <i className="block h-[7px] w-[7px] bg-[#1eb4d4]" />
        <i className="block h-[7px] w-[7px] bg-[#1eb4d4]" />
        <i className="block h-[7px] w-[7px] bg-[#1789a8]" />
        <i className="block h-[7px] w-[7px] bg-[#1789a8]" />
      </span>
      <span className="text-[18px] font-semibold tracking-tight text-white lowercase">cinc</span>
    </span>
  );
}

function NavIcon({ id }: { id: NavSection }) {
  const common = "h-[15px] w-[15px]";
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
  return (
    <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="8" r="5.2" />
      <path d="M3 8h10M8 3c1.6 1.6 1.6 8.4 0 10M8 3c-1.6 1.6-1.6 8.4 0 10" />
    </svg>
  );
}

const ACTIVITY = [
  { icon: "✉", color: "#2e9e5b", text: "Morgan Ellis opened property alert sent 10/18/2026", time: "Oct 21, 2026 at 5:54 PM" },
  { icon: "↗", color: "#2e9e5b", text: "Jordan Blake clicked a listing link", time: "Oct 21, 2026 at 5:25 PM" },
  { icon: "◉", color: "#e39b2b", text: "Avery Quinn viewed a property ($2,149,000, 810 235 Keith Road)", time: "Oct 21, 2026 at 4:10 PM" },
  { icon: "✉", color: "#1c93b5", text: "Casey Archibald sent Priya Sharma a message with subject 'New listings in Kitsilano'", time: "Oct 20, 2026 at 11:02 AM" },
];

const ROSTER = [
  ["Casey Archibald", "Agent"],
  ["Kayla Gerak", "Agent"],
  ["Anastasiia Borovyk", "Agent"],
  ["Kevin Barrett", "Broker"],
];

export function Shell({ route, children }: { route: CincRoute; children: ReactNode }) {
  const section = sectionOf(route);
  const menu = titleMenu(route);
  const [hover, setHover] = useState<NavSection | null>(null);
  const [titleOpen, setTitleOpen] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [rail, setRail] = useState(false);
  const [feed, setFeed] = useState("All");
  const [modal, setModal] = useState<ReactNode>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    document.title = `${titleOf(route)} · CINC`;
  }, [route]);

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

  const showSearch = route.view === "leads";

  return (
    <ChromeContext.Provider value={api}>
      <div className="flex h-screen overflow-hidden bg-[#f5f5f5] text-[13px] text-[#333]">
        <aside className="flex w-[147px] shrink-0 flex-col bg-[#2c3c44] text-white">
          <div className="flex h-[58px] items-center bg-[#243238] px-3">
            <Logo />
          </div>
          <nav className="pt-[28px]" onMouseLeave={() => setHover(null)}>
            {NAV.map((item) => {
              const active = section === item.id;
              const open = active || hover === item.id;
              return (
                <div key={item.id} className="relative" onMouseEnter={() => setHover(item.id)}>
                  <a
                    href={item.href}
                    className={`flex h-[31px] items-center gap-2 px-3 text-[13px] ${active ? "bg-[#3a4e59] text-[#1b9cb8]" : "text-[#f4f7f8] hover:bg-[#33444d]"}`}
                  >
                    <NavIcon id={item.id} />
                    <span className="truncate">{item.label}</span>
                    {item.dot ? <span className="ml-auto h-[7px] w-[7px] shrink-0 rounded-full bg-[#e23d45]" /> : null}
                  </a>
                  {active && item.children ? (
                    <div className="bg-[#243238] py-1">
                      {item.children.map((child) => (
                        <a key={child.label} href={child.href} className="flex h-[26px] items-center gap-2 pr-2 pl-7 text-[12px] text-[#d5dde1] hover:text-white">
                          <span className="h-[5px] w-[5px] rounded-full bg-[#1b9cb8]" />
                          {child.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {!active && open && item.children ? (
                    <div className="absolute top-0 left-full z-30 min-w-[180px] border border-[#1c282e] bg-[#2c3c44] py-1 shadow-lg">
                      {item.children.map((child) => (
                        <a key={child.label} href={child.href} className="block px-3 py-[6px] text-[12px] text-white hover:bg-[#364850] hover:text-[#1b9cb8]">
                          {child.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[58px] shrink-0 items-center gap-3 border-b border-[#e5e5e5] bg-white pr-4 pl-5">
            <div className="relative" ref={titleRef}>
              <button
                type="button"
                className="flex items-center gap-[7px] text-[22px] leading-none font-light text-[#2a9bb8]"
                onClick={() => menu.length && setTitleOpen((value) => !value)}
              >
                <span>{titleOf(route)}</span>
                {menu.length ? <Caret className="mt-px text-[#2a9bb8]" /> : null}
              </button>
              {titleOpen && menu.length ? (
                <div className="absolute top-[calc(100%+10px)] left-0 z-50 w-max min-w-[220px] bg-white py-2 shadow-[0_8px_24px_rgba(15,23,28,0.16)]">
                  {menu.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="block px-5 py-[10px] text-[15px] leading-5 font-normal text-[#2c2c2c] hover:bg-[#f5f5f5]"
                      onClick={() => setTitleOpen(false)}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
            {showSearch ? (
              <button
                type="button"
                title="Search"
                className="grid h-7 w-7 place-items-center text-[#1c93b5]"
                onClick={() => setSearchOpen((value) => !value)}
              >
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="7" cy="7" r="4.2" />
                  <path d="M10.5 10.5 14 14" />
                </svg>
              </button>
            ) : null}
            {showSearch && searchOpen ? (
              <input
                autoFocus
                value={leadSearch}
                onChange={(event) => setLeadSearch(event.target.value)}
                placeholder="Search leads..."
                className="h-7 w-56 border border-[#d5d5d5] px-2 text-[13px] outline-none focus:border-[#1c93b5]"
              />
            ) : null}
            <div className="ml-auto flex items-center gap-3">
              <a
                href={href.publicSite}
                className="inline-flex items-center gap-1 bg-[#d9363e] px-2 py-[5px] text-[10px] font-bold tracking-wide text-white uppercase"
                title="End the demo impersonation and return to the public site"
              >
                <span aria-hidden>↩</span> End Become User
              </a>
              <button type="button" className="text-[11px] font-semibold tracking-wide text-[#1b9cb8] uppercase" onClick={() => setHelpOpen(true)}>
                Help
              </button>
              <div className="relative">
                <button type="button" className="flex items-center gap-1 text-[13px] font-semibold text-[#333]" onClick={() => setAccountOpen((value) => !value)}>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#1c93b5] text-[11px] text-white">{CRM_AGENT.initials}</span>
                  <span className="text-[#888]">▾</span>
                </button>
                {accountOpen ? (
                  <div className="absolute top-9 right-0 z-40 w-48 border border-[#e5e5e5] bg-white py-1 shadow-md" onMouseLeave={() => setAccountOpen(false)}>
                    <a href={href.plans} className="block px-3 py-2 text-[13px] hover:bg-[#f6f6f6]">Plans</a>
                    <a href={href.profile} className="block px-3 py-2 text-[13px] hover:bg-[#f6f6f6]">Profile & Settings</a>
                    <a href={href.publicSite} className="block px-3 py-2 text-[13px] hover:bg-[#f6f6f6]">Public Website</a>
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
            {rail ? (
              <aside className="flex w-[180px] shrink-0 flex-col border-l border-[#e5e5e5] bg-[#f7f7f7]">
                <div className="border-b border-[#1c93b5] bg-white px-2 py-2 text-[12px] font-semibold text-[#1c93b5]">Activity</div>
                <label className="px-2 py-2">
                  <select className="h-6 w-full border border-[#ccc] bg-white text-[12px]" value={feed} onChange={(event) => setFeed(event.target.value)}>
                    {["All", "Notes", "Views & Favorites", "Agent Actions", "Communications"].map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <div className="min-h-0 flex-1 overflow-auto px-2">
                  {ACTIVITY.filter((item) => feed === "All" || (feed === "Communications" ? item.icon === "✉" : feed === "Views & Favorites" ? item.icon !== "✉" : feed === "Agent Actions" ? item.text.startsWith("Casey") : item.icon === "◉")).map((item) => (
                    <article key={item.time} className="mb-2 bg-white p-2 shadow-sm">
                      <p className="text-[11px] leading-snug text-[#1c93b5]">
                        <span className="mr-1" style={{ color: item.color }}>{item.icon}</span>
                        {item.text}
                      </p>
                      <p className="mt-1 text-[10px] text-[#999]">{item.time}</p>
                    </article>
                  ))}
                </div>
                <div className="border-t border-[#e5e5e5] bg-white">
                  <p className="px-2 py-1 text-[10px] font-bold tracking-wide text-[#888] uppercase">Dialer</p>
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
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/35 px-4 py-16" onMouseDown={() => setHelpOpen(false)}>
          <div className="w-full max-w-md bg-white p-5 shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
            <h2 className="text-[16px] font-semibold">Help</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#444]">
              This is the Casey Archibald demo of the CINC agent CRM. Messages, calls, and saves stay on this device.
              Call (604) 363-7858 or write agent@example.com.
            </p>
            <div className="mt-4 flex gap-3 text-[13px]">
              <a className="text-[#1c93b5]" href={href.faq}>FAQ</a>
              <a className="text-[#1c93b5]" href={href.contact}>Contact</a>
              <button type="button" className="ml-auto text-[#888]" onClick={() => setHelpOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
      {message ? (
        <div className="fixed bottom-4 left-1/2 z-[90] -translate-x-1/2 bg-[#243238] px-4 py-2 text-[13px] text-white shadow-lg">
          {message}
        </div>
      ) : null}
    </ChromeContext.Provider>
  );
}
