import type { Metadata } from "next";
import { UnshieldFlow } from "@/components/app/flows/unshield-flow";

export const metadata: Metadata = { title: "Unshield (mock)", description: "Unshield USDG in mock mode. No real funds move." };

export default function Page() {
  return <UnshieldFlow />;
}
