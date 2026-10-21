import { redirect } from "next/navigation";

/** Live CINC maps /seller/homeestimate → homevaluation. */
export default function HomeEstimateIndexPage() {
  redirect("/seller/homeestimate/homevaluation");
}
