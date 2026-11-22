import type { Metadata } from "next";
import { SettingsView } from "@/components/app/flows/settings-view";

export const metadata: Metadata = { title: "Settings and status", description: "Mode, mainnet conditions, allowlist and configuration status." };

export default function Page() {
  return <SettingsView />;
}
