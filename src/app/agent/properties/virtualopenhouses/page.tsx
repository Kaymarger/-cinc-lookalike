"use client";

import { HouseList } from "@/components/agent/house-list";

export default function VirtualOpenHousesPage() {
  return (
    <HouseList
      storageKey="gvhs-virtual-open-houses"
      title="Virtual Open Houses"
      empty="No virtual open houses."
      seed={[]}
    />
  );
}
