import type { Metadata } from "next";
import { brand } from "@config/brand";
import { FACTS_CHECKED_ON, SOURCES } from "@config/facts";
import { LegalPage } from "@/components/site/legal-page";
import { DISCLOSURES } from "@/content/disclosures";

export const metadata: Metadata = { title: "Disclosures and risks", description: "What the interface does, what the underlying pool does, and what can go wrong." };

export default function Page() {
  return (
    <LegalPage title="Disclosures and risks" lead={`What ${brand.name} does, what the underlying pool does, and what can go wrong. Checked on ${FACTS_CHECKED_ON}. Facts change: verify them again before relying on them.`}>
      {DISCLOSURES.map((d) => (
        <section key={d.id} id={d.id} className="flex flex-col gap-3">
          <h2>{d.title}</h2>
          <p>{d.body}</p>
          {d.sources && (
            <p className="text-14">
              Sources:{" "}
              {d.sources.map((s, i) => (
                <span key={s.href}>
                  {i > 0 && ", "}
                  <a className="link" href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </span>
              ))}
              . Read {FACTS_CHECKED_ON}.
            </p>
          )}
        </section>
      ))}
      <section className="flex flex-col gap-3">
        <h2>Where these facts come from</h2>
        <ul>
          <li>
            <a className="link" href={SOURCES.rail20Contracts} target="_blank" rel="noopener noreferrer">RAIL20 contracts and fees</a>
          </li>
          <li>
            <a className="link" href={SOURCES.rail20Faq} target="_blank" rel="noopener noreferrer">RAIL20 FAQ</a>
          </li>
          <li>
            <a className="link" href={SOURCES.rail20Architecture} target="_blank" rel="noopener noreferrer">RAIL20 architecture</a>
          </li>
          <li>
            <a className="link" href={SOURCES.paxosUsdg} target="_blank" rel="noopener noreferrer">Paxos USDG documentation</a>
          </li>
          <li>On-chain reads of chain 4663 (code, implementation slots, token status), recorded in the project&apos;s verification log.</li>
        </ul>
        <p>Links to other parties are context only. They do not mean those parties support this interface.</p>
      </section>
    </LegalPage>
  );
}
