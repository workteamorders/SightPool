import type { Metadata } from "next";
import { brand } from "@config/brand";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Privacy", description: "Placeholder privacy notice, pending counsel review." };

export default function Page() {
  return (
    <LegalPage title="Privacy" lead={`What ${brand.name} collects: as little as it can.`}>
      <section className="flex flex-col gap-3">
        <h2>Stored in your browser only</h2>
        <ul>
          <li>Your Terms answer and its version.</li>
          <li>Mock balances, notes, activity and form drafts.</li>
          <li>An export log: time, format and record count of disclosure packages. Never their content or password.</li>
        </ul>
        <p>You can clear mock data in Settings, or clear site data in your browser.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Seen by our hosting</h2>
        <ul>
          <li>Your country, from the hosting provider&apos;s network header, to apply the region check. It is not stored by the interface.</li>
          <li>Read-only blockchain requests sent through our relay (for example a token balance). The relay keeps no records of its own; the hosting and RPC providers may keep standard request logs.</li>
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Never collected</h2>
        <p>No seed phrases, private keys, passwords for your wallet, or signatures. No analytics, no advertising trackers, no cookies set by the interface.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Wallet connection</h2>
        <p>In read-only mode, connecting a wallet goes through WalletConnect when you choose it, which has its own privacy terms. The interface only reads your public address.</p>
      </section>
    </LegalPage>
  );
}
