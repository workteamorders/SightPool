import type { Metadata } from "next";
import { ShieldFlow } from "@/components/app/flows/shield-flow";

export const metadata: Metadata = { title: "Shield (mock)", description: "Shield USDG in mock mode. No real funds move." };

export default function Page() {
  return <ShieldFlow />;
}
