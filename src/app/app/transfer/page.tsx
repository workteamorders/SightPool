import type { Metadata } from "next";
import { TransferFlow } from "@/components/app/flows/transfer-flow";

export const metadata: Metadata = { title: "Transfer (mock)", description: "Transfer USDG in mock mode. No real funds move." };

export default function Page() {
  return <TransferFlow />;
}
