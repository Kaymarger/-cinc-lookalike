"use client";

import { HouseList, type HouseRow } from "@/components/agent/house-list";

const SEED: HouseRow[] = [];

export default function OpenHousesPage() {
  return (
    <HouseList
      storageKey="gvhs-open-houses"
      title="Upcoming Open Houses"
      empty="No upcoming open houses."
      seed={SEED}
    />
  );
}
