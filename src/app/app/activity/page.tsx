import type { Metadata } from "next";
import { ActivityView } from "@/components/app/flows/activity-view";

export const metadata: Metadata = { title: "Activity", description: "Your mock activity and notes." };

export default function Page() {
  return <ActivityView />;
}
