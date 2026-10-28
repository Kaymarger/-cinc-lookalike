/** Hash routes that mirror the live CINC agent SPA. */

export const SPA = "/dashboard/spa";

export const href = {
  launchpad: `${SPA}#launchpad/agent`,
  call: `${SPA}#launchpad/dialersummary`,
  leads: `${SPA}#leads`,
  leadsReturn: `${SPA}#leads/overviewreturn`,
  exportLeads: `${SPA}#leads/export`,
  dialerHistory: `${SPA}#leads/dialer-history`,
  lead: (id: string, tab = "activity") => `${SPA}#leads/details/${encodeURIComponent(id)}/${tab}`,
  dealsPurchases: `${SPA}/deals#/dashboard/purchases`,
  dealsListings: `${SPA}/deals#/dashboard/listings`,
  inbox: `${SPA}#inbox`,
  sent: `${SPA}#inbox/sent`,
  drafts: `${SPA}#inbox/drafts`,
  trashed: `${SPA}#inbox/trashed`,
  templates: `${SPA}#inbox/templates`,
  autotracks: `${SPA}#automations/autotracks`,
  behavioral: `${SPA}#automations/behavioralcomms`,
  ai: `${SPA}#automations/ai`,
  properties: `${SPA}#properties`,
  textResponder: `${SPA}#properties/textresponder`,
  openHouses: `${SPA}#properties/openhouses`,
  virtualOpenHouses: `${SPA}#properties/virtualopenhouses`,
  addProperty: `${SPA}#properties/add`,
  seller: "/dashboard/sellersuite/seller/#main",
  landing: "/dashboard/landing/#/",
  landingCat: (category: string) => `/dashboard/landing/#category/${category}`,
  profile: `${SPA}#settings/profile/profile`,
  settings: `${SPA}#settings/profile/settings/agent`,
  integrations: `${SPA}#settings/profile/integrations/agent`,
  notifications: `${SPA}#settings/profile/notifications/agent`,
  customLinks: `${SPA}#settings/profile/customlinks/agent`,
  advanced: `${SPA}#settings/profile/advanced/agent`,
  contacts: `${SPA}#contacts`,
  agents: `${SPA}#agents`,
  users: `${SPA}#agents`,
  plans: `${SPA}#plans`,
  dialer: `${SPA}#dialer`,
  calendar: `${SPA}#calendar`,
  tasks: `${SPA}#tasks`,
  marketing: `${SPA}#marketing`,
  reports: `${SPA}#reports`,
  publicSite: "/",
  faq: "/faq",
  contact: "/contact",
};

export type LeadTab = "activity" | "info" | "plans" | "appointments" | "conversations" | "plips";

export type CincRoute =
  | { view: "launchpad" }
  | { view: "callsummary" }
  | { view: "leads"; mode: "list" | "export" | "history"; leadId?: string; tab: LeadTab }
  | { view: "deals"; board: "purchases" | "listings" }
  | { view: "inbox"; folder: "inbox" | "sent" | "drafts" | "trashed" | "templates" }
  | { view: "autotracks" }
  | { view: "behavioral" }
  | { view: "ai" }
  | { view: "properties"; sub: "list" | "text" | "open" | "virtual" | "add" }
  | { view: "seller" }
  | { view: "landing"; category: "all" | "buyers" | "sellers" | "contact" }
  | { view: "settings"; tab: "profile" | "settings" | "integrations" | "notifications" | "customlinks" | "advanced" }
  | { view: "contacts" }
  | { view: "users" }
  | { view: "plans" }
  | { view: "dialer" }
  | { view: "calendar" }
  | { view: "tasks" }
  | { view: "marketing" }
  | { view: "reports" };

export type NavSection = "launchpad" | "leads" | "contacts" | "deals" | "comms" | "auto" | "props" | "web" | "marketing" | "agents" | "settings" | "other";

const LEAD_TABS: LeadTab[] = ["activity", "info", "plans", "appointments", "conversations", "plips"];

function asLeadTab(value: string | undefined): LeadTab {
  return LEAD_TABS.includes(value as LeadTab) ? (value as LeadTab) : "activity";
}

export function parseRoute(pathname: string, hash: string): CincRoute {
  if (pathname.startsWith("/dashboard/spa/deals")) {
    return { view: "deals", board: hash.includes("listings") ? "listings" : "purchases" };
  }
  if (pathname.startsWith("/dashboard/sellersuite")) return { view: "seller" };
  if (pathname.startsWith("/dashboard/landing")) {
    if (hash.includes("buyers")) return { view: "landing", category: "buyers" };
    if (hash.includes("sellers")) return { view: "landing", category: "sellers" };
    if (hash.includes("contact")) return { view: "landing", category: "contact" };
    return { view: "landing", category: "all" };
  }

  const parts = hash.replace(/^#/, "").split("/").filter(Boolean);
  const [a, b, c, d] = parts;

  if (!a || a === "launchpad") {
    if (b === "dialersummary") return { view: "callsummary" };
    return { view: "launchpad" };
  }
  if (a === "leads") {
    if (b === "export") return { view: "leads", mode: "export", tab: "activity" };
    if (b === "dialer-history") return { view: "leads", mode: "history", tab: "activity" };
    if (b === "details" && c) return { view: "leads", mode: "list", leadId: decodeURIComponent(c), tab: asLeadTab(d) };
    if (b === "overviewreturn") return { view: "leads", mode: "list", tab: "activity" };
    return { view: "leads", mode: "list", tab: "activity" };
  }
  if (a === "inbox") {
    if (b === "sent" || b === "drafts" || b === "trashed" || b === "templates") {
      return { view: "inbox", folder: b };
    }
    return { view: "inbox", folder: "inbox" };
  }
  if (a === "automations") {
    if (b === "behavioralcomms") return { view: "behavioral" };
    if (b === "ai") return { view: "ai" };
    return { view: "autotracks" };
  }
  if (a === "properties") {
    if (b === "textresponder") return { view: "properties", sub: "text" };
    if (b === "openhouses") return { view: "properties", sub: "open" };
    if (b === "virtualopenhouses") return { view: "properties", sub: "virtual" };
    if (b === "add") return { view: "properties", sub: "add" };
    return { view: "properties", sub: "list" };
  }
  if (a === "settings" && b === "users") return { view: "users" };
  if (a === "agents") return { view: "users" };
  if (a === "contacts") return { view: "contacts" };
  if (a === "settings") {
    const tab = c === "settings" || c === "integrations" || c === "notifications" || c === "customlinks" || c === "advanced" || c === "profile" ? c : "profile";
    return { view: "settings", tab };
  }
  if (a === "plans") return { view: "plans" };
  if (a === "dialer") return { view: "dialer" };
  if (a === "calendar") return { view: "calendar" };
  if (a === "tasks") return { view: "tasks" };
  if (a === "marketing") return { view: "marketing" };
  if (a === "reports") return { view: "reports" };
  return { view: "launchpad" };
}

export function sectionOf(route: CincRoute): NavSection {
  switch (route.view) {
    case "launchpad":
    case "callsummary":
      return "launchpad";
    case "leads":
      return "leads";
    case "deals":
      return "deals";
    case "inbox":
      return "comms";
    case "autotracks":
    case "behavioral":
    case "ai":
      return "auto";
    case "properties":
      return "props";
    case "seller":
    case "landing":
      return "web";
    case "contacts":
      return "contacts";
    case "users":
      return "agents";
    case "marketing":
      return "marketing";
    case "settings":
      return "settings";
    default:
      return "other";
  }
}

export function titleOf(route: CincRoute): string {
  switch (route.view) {
    case "launchpad":
      return "Agent Launchpad";
    case "callsummary":
      return "Call Summary";
    case "leads":
      return "Leads Dashboard";
    case "deals":
      return "Deals Dashboard";
    case "inbox":
      return "Communication";
    case "autotracks":
    case "behavioral":
    case "ai":
      return "Automations";
    case "properties":
      if (route.sub === "text") return "Text Responder";
      if (route.sub === "open") return "Open Houses";
      if (route.sub === "virtual") return "Virtual Open Houses";
      if (route.sub === "add") return "Add Pocket Listing";
      return "Properties";
    case "seller":
      return "";
    case "landing":
      return "Landing Pages";
    case "settings":
      return "Settings";
    case "contacts":
      return "Contacts";
    case "users":
      return "Agents";
    case "plans":
      return "Plans";
    case "dialer":
      return "Dialer";
    case "calendar":
      return "Calendar";
    case "tasks":
      return "Tasks";
    case "marketing":
      return "Marketing Dashboard";
    case "reports":
      return "Reports";
    default:
      return "CINC";
  }
}

export function titleMenu(route: CincRoute): { label: string; href: string }[] {
  switch (route.view) {
    case "launchpad":
      return [{ label: "Call Summary", href: href.call }];
    case "callsummary":
      return [{ label: "Agent Launchpad", href: href.launchpad }];
    case "leads":
      return [
        { label: "Export Leads", href: href.exportLeads },
        { label: "Dialer History", href: href.dialerHistory },
      ];
    case "deals":
    case "inbox":
    case "autotracks":
    case "behavioral":
    case "ai":
    case "seller":
    case "landing":
    case "settings":
    case "users":
      return [];
    case "properties":
      return [
        { label: "Properties", href: href.properties },
        { label: "Text Responder", href: href.textResponder },
        { label: "Upcoming Open Houses", href: href.openHouses },
        { label: "Virtual Open Houses", href: href.virtualOpenHouses },
      ];
    default:
      return [];
  }
}

export function go(url: string) {
  const mark = url.indexOf("#");
  const path = mark >= 0 ? url.slice(0, mark) : url;
  const hash = mark >= 0 ? url.slice(mark) : "";
  if (window.location.pathname === path) {
    if (window.location.hash !== hash) window.location.hash = hash;
    else window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.location.href = url;
}

export function agentPathToCinc(pathname: string): string {
  const p = pathname.replace(/\/$/, "") || "/agent";
  const details = p.match(/^\/agent\/leads\/details\/([^/]+)/);
  if (details) return href.lead(details[1], "info");
  const oneLead = p.match(/^\/agent\/leads\/([^/]+)$/);
  if (oneLead && oneLead[1] !== "export" && oneLead[1] !== "dialer-history") {
    return href.lead(oneLead[1], "info");
  }
  const map: Record<string, string> = {
    "/agent": href.launchpad,
    "/agent/launchpad/agent": href.launchpad,
    "/agent/launchpad/dialersummary": href.call,
    "/agent/leads": href.leads,
    "/agent/leads/export": href.exportLeads,
    "/agent/leads/dialer-history": href.dialerHistory,
    "/agent/deals": href.dealsPurchases,
    "/agent/deals/purchases": href.dealsPurchases,
    "/agent/deals/listings": href.dealsListings,
    "/agent/inbox": href.inbox,
    "/agent/inbox/sent": href.sent,
    "/agent/inbox/drafts": href.drafts,
    "/agent/inbox/trashed": href.trashed,
    "/agent/inbox/templates": href.templates,
    "/agent/communications": href.inbox,
    "/agent/automations": href.autotracks,
    "/agent/automations/autotracks": href.autotracks,
    "/agent/automations/behavioralcomms": href.behavioral,
    "/agent/automations/behavioral": href.behavioral,
    "/agent/automations/ai": href.ai,
    "/agent/properties": href.properties,
    "/agent/properties/textresponder": href.textResponder,
    "/agent/properties/openhouses": href.openHouses,
    "/agent/properties/virtualopenhouses": href.virtualOpenHouses,
    "/agent/properties/add": href.addProperty,
    "/agent/sellersuite": href.seller,
    "/agent/website": href.seller,
    "/agent/landing": href.landing,
    "/agent/landing/buyers": href.landingCat("buyers"),
    "/agent/landing/sellers": href.landingCat("sellers"),
    "/agent/landing/contact": href.landingCat("contact"),
    "/agent/settings": href.profile,
    "/agent/settings/profile": href.profile,
    "/agent/settings/settings": href.settings,
    "/agent/settings/integrations": href.integrations,
    "/agent/settings/notifications": href.notifications,
    "/agent/settings/customlinks": href.customLinks,
    "/agent/settings/users": href.users,
    "/agent/users": href.agents,
    "/agent/agents": href.agents,
    "/agent/contacts": href.contacts,
    "/agent/marketing": href.marketing,
    "/agent/plans": href.plans,
    "/agent/dialer": href.dialer,
    "/agent/calendar": href.calendar,
    "/agent/tasks": href.tasks,
    "/agent/reports": href.reports,
    "/agent/listings": href.dealsListings,
    "/agent/clients": href.leads,
    "/agent/showings": href.launchpad,
    "/agent/activity": href.launchpad,
    "/agent/alerts": href.behavioral,
  };
  if (map[p]) return map[p];
  if (p.startsWith("/agent/settings")) return href.profile;
  if (p.startsWith("/agent/automations")) return href.autotracks;
  if (p.startsWith("/agent/inbox") || p.startsWith("/agent/communications")) return href.inbox;
  if (p.startsWith("/agent/properties")) return href.properties;
  if (p.startsWith("/agent/landing")) return href.landing;
  if (p.startsWith("/agent/deals")) return href.dealsPurchases;
  return href.launchpad;
}
