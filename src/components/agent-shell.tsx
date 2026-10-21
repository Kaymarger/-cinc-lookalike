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
  HelpCircle,
  House,
  Inbox,
  Laptop,
  Menu,
  Search,
  Users,
  X,
} from "lucide-react";
import { CRM_AGENT } from "@/lib/cinc-crm";
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
    href: "/agent",
    label: "Launchpad",
    icon: Gauge,
    children: [
      { href: "/agent", label: "Agent" },
      { href: "/agent#call-summary", label: "Call Summary" },
    ],
    match: (p) => p === "/agent",
  },
  {
    href: "/agent/leads",
    label: "Leads",
    icon: Users,
    match: (p) => p.startsWith("/agent/leads"),
  },
  {
    href: "/agent/deals",
    label: "Deals",
    icon: CircleDollarSign,
    match: (p) => p.startsWith("/agent/deals") || p.startsWith("/agent/showings"),
  },
  {
    href: "/agent/communications",
    label: "Communications",
    icon: Inbox,
    children: [
      { href: "/agent/communications", label: "Inbox" },
      { href: "/agent/communications?folder=sent", label: "Sent" },
      { href: "/agent/communications?folder=drafts", label: "Drafts" },
      { href: "/agent/communications?folder=trashed", label: "Trashed" },
    ],
    match: (p) =>
      p.startsWith("/agent/communications") || p.startsWith("/agent/activity"),
  },
  {
    href: "/agent/automations",
    label: "Automations",
    icon: AutoIcon,
    children: [
      { href: "/agent/automations", label: "Action plans" },
      { href: "/agent/automations/templates", label: "Templates" },
      { href: "/agent/automations/lists", label: "Smart lists" },
      { href: "/agent/automations/alerts", label: "Listing alerts" },
      { href: "/agent/automations/assign", label: "Auto-assign" },
      { href: "/agent/automations/behavioral", label: "Behavioral Messaging" },
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
      { href: "/agent/properties?view=text", label: "Text Responder" },
      { href: "/agent/properties?view=oh", label: "Upcoming Open Houses" },
      { href: "/agent/properties?view=voh", label: "Virtual Open Houses" },
    ],
    match: (p) =>
      p.startsWith("/agent/properties") || p.startsWith("/agent/listings"),
  },
  {
    href: "/agent/website",
    label: "Website",
    icon: Laptop,
    match: (p) => p.startsWith("/agent/website"),
  },
  {
    href: "/agent/settings",
    label: "Settings",
    icon: HelpCircle,
    children: [
      { href: "/agent/settings", label: "Profile" },
      { href: "/agent/settings/team", label: "Team" },
      { href: "/agent/settings/routing", label: "Routing" },
      { href: "/agent/settings/notifications", label: "Notifications" },
      { href: "/agent/settings/phone", label: "Phone" },
      { href: "/agent/settings/email", label: "Email" },
      { href: "/agent/settings/billing", label: "Billing" },
    ],
    match: (p) => p.startsWith("/agent/settings"),
  },
];

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
  { test: (p) => p === "/agent", title: "Agent Launchpad" },
  { test: (p) => p.startsWith("/agent/leads"), title: "Leads Dashboard" },
  { test: (p) => p.startsWith("/agent/deals"), title: "Deals Dashboard" },
  { test: (p) => p.startsWith("/agent/communications"), title: "Communication" },
  { test: (p) => p.startsWith("/agent/automations"), title: "Automations" },
  { test: (p) => p.startsWith("/agent/properties"), title: "Properties" },
  { test: (p) => p.startsWith("/agent/website"), title: "Website" },
  { test: (p) => p.startsWith("/agent/settings"), title: "Settings" },
  { test: (p) => p.startsWith("/agent/listings"), title: "Properties" },
  { test: (p) => p.startsWith("/agent/activity"), title: "Communication" },
  { test: (p) => p.startsWith("/agent/showings"), title: "Deals Dashboard" },
];

export function AgentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNav, setMobileNav] = useState(false);
  const title =
    PAGE_TITLES.find((t) => t.test(pathname))?.title ?? "Agent Workspace";

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
          <div className="flex min-w-0 items-center gap-1.5">
            <h1 className="truncate text-[17px] font-normal text-[#4aa3d9]">
              {title}
            </h1>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#4aa3d9]/80" />
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
            <Link
              href="/agent/settings"
              className="flex items-center gap-1.5 text-[13px] text-[#5a6f82]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dce4ec] text-[11px] font-semibold text-[#3d5164]">
                {CRM_AGENT.initials}
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 sm:block" />
            </Link>
            <Link
              href="/agent/settings/website"
              className="hidden text-[#8a9bab] hover:text-[#5a6f82] sm:block"
              aria-label="Website settings"
            >
              <Globe className="h-4 w-4" />
            </Link>
            <HelpCircle className="hidden h-4 w-4 text-[#8a9bab] xl:block" />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
