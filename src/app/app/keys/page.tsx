import type { Metadata } from "next";
import { KeysView } from "@/components/app/flows/keys-view";

export const metadata: Metadata = { title: "Disclosure package", description: "Prepare a record of your own activity for an auditor or tax advisor." };

export default function Page() {
  return <KeysView />;
}
