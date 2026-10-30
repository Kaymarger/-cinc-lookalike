"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ContactsView } from "./contacts-view";
import { LeadSearchPage } from "./lead-searches";
import { LeadsView } from "./leads-view";
import { UsersView } from "./users-view";
import { parseRoute } from "./route";
import { Shell } from "./shell";
import { CincStoreProvider } from "./store";
import {
  AiView,
  AutoTracksView,
  BehavioralView,
  CalendarView,
  CallSummaryView,
  DealsView,
  DialerView,
  InboxView,
  LandingView,
  BrokerLaunchpad,
  GmailView,
  LaunchpadView,
  MarketingView,
  PlansView,
  PropertiesView,
  ReportsView,
  SellerView,
  WebsiteView,
  SettingsView,
  TasksView,
} from "./views";

function useRoute() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  useEffect(() => {
    const read = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.startsWith("/dashboard/landing") && (hash === "" || hash === "#")) {
        window.history.replaceState(null, "", "/dashboard/landing/#/");
      } else if (path.startsWith("/dashboard/sellersuite") && !hash.includes("main")) {
        window.history.replaceState(null, "", "/dashboard/sellersuite/seller/#main");
      }
      setHash(window.location.hash);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [pathname]);
  return parseRoute(pathname, hash);
}

function View() {
  const route = useRoute();
  if (route.view === "launchpad") return <LaunchpadView />;
  if (route.view === "callsummary") return <CallSummaryView />;
  if (route.view === "leads") return <LeadsView mode={route.mode} leadId={route.leadId} tab={route.tab} />;
  if (route.view === "leadsearch") return <LeadSearchPage leadId={route.leadId} searchId={route.searchId} />;
  if (route.view === "contacts") return <ContactsView mode={route.mode} />;
  if (route.view === "deals") return <DealsView board={route.board} />;
  if (route.view === "inbox") return <InboxView folder={route.folder} />;
  if (route.view === "autotracks") return <AutoTracksView />;
  if (route.view === "behavioral") return <BehavioralView />;
  if (route.view === "ai") return <AiView />;
  if (route.view === "properties") return <PropertiesView sub={route.sub} />;
  if (route.view === "seller") return <SellerView />;
  if (route.view === "website") return <WebsiteView page={route.page} />;
  if (route.view === "landing") return <LandingView category={route.category} />;
  if (route.view === "settings") return <SettingsView tab={route.tab} />;
  if (route.view === "users") return <UsersView mode={route.mode} />;
  if (route.view === "gmail") return <GmailView />;
  if (route.view === "broker") return <BrokerLaunchpad />;
  if (route.view === "plans") return <PlansView />;
  if (route.view === "dialer") return <DialerView />;
  if (route.view === "calendar") return <CalendarView />;
  if (route.view === "tasks") return <TasksView />;
  if (route.view === "marketing") return <MarketingView />;
  return <ReportsView />;
}

function Frame() {
  const route = useRoute();
  return (
    <Shell route={route}>
      <View />
    </Shell>
  );
}

export function CincApp() {
  return (
    <CincStoreProvider>
      <Frame />
    </CincStoreProvider>
  );
}
