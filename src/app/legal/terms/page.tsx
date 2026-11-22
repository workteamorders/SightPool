import type { Metadata } from "next";
import { brand } from "@config/brand";
import { config } from "@config/env";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Terms", description: "Placeholder terms, pending counsel review." };

export default function Page() {
  return (
    <LegalPage title="Terms" lead={`Version ${config.tosVersion}. The rules for using this interface preview, in plain words, until counsel writes the real terms.`}>
      <section className="flex flex-col gap-3">
        <h2>What this is</h2>
        <p>{brand.name} is a software interface preview. In this build every action is simulated. It does not move funds, hold funds, hold keys, or send transactions.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Who may use it</h2>
        <p>You may not use it if you are a resident of, or located in, the United States or another restricted region. You confirm this before connecting a wallet or running a mock action.</p>
        <p>The region check is a restriction of this interface. It is not access control on the pool contracts, which are permissionless and run by others.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>What you must not do</h2>
        <ul>
          <li>Try to get around the region check, screening, or any sanctions control.</li>
          <li>Use the interface for funds that come from crime or are subject to sanctions.</li>
          <li>Treat anything here as financial, legal or tax advice.</li>
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2>No promises</h2>
        <p>The interface is provided as is. It does not promise privacy, availability or any result. The underlying pool has no formal audit according to its own documentation.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Changes</h2>
        <p>These terms will be replaced by text written by counsel. When the version changes, you will be asked to accept again.</p>
      </section>
    </LegalPage>
  );
}
