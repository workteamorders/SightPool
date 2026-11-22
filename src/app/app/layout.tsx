import type { Metadata } from "next";
import { AppProvider } from "@/components/app/app-context";
import { AppShell } from "@/components/app/shell";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
