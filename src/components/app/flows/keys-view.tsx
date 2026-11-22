"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, FileCheck2 } from "lucide-react";
import { brand } from "@config/brand";
import { KDF, NO_VIEW_KEY_BANNER, decryptPackage, encryptPackage, parseEnvelope, passwordProblem, toCsv, toJson, type ExportLogEntry } from "@/lib/disclosure";
import { KEYS, readJson, writeJson } from "@/lib/storage";
import { formatDate } from "@/lib/format";
import { Notice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-styles";
import { Field, FileInput, Input, RadioGroup, Switch } from "@/components/ui/field";
import { EmptyState, ErrorState, StatementSkeleton } from "@/components/ui/states";
import { Row, Statement } from "@/components/ui/statement";
import { useToast } from "@/components/ui/toast";
import { useApp } from "../app-context";

type Range = "all" | "30d" | "7d";

function download(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function KeysView() {
  const { client, version, regionAllows } = useApp();
  const { toast } = useToast();
  const [count, setCount] = useState<number | null>(null);
  const [range, setRange] = useState<Range>("all");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [encrypt, setEncrypt] = useState(true);
  const [pw, setPw] = useState("");
  const [pwTouched, setPwTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [log, setLog] = useState<ExportLogEntry[]>([]);

  useEffect(() => {
    void client.exportDisclosure().then((r) => setCount(r.length));
    setLog(readJson<ExportLogEntry[]>(KEYS.exportLog, []));
  }, [client, version]);

  const pwError = encrypt ? passwordProblem(pw) : null;

  const prepare = async () => {
    setPwTouched(true);
    if (pwError) return;
    setBusy(true);
    setErr(null);
    try {
      const from = range === "all" ? undefined : Date.now() - (range === "30d" ? 30 : 7) * 86_400_000;
      const records = await client.exportDisclosure({ from });
      const meta = { generatedAt: new Date().toISOString(), product: brand.name };
      const plain = format === "csv" ? toCsv(records, meta) : toJson(records, meta);
      const stamp = meta.generatedAt.slice(0, 10);
      const base = `disclosure-package-mock-${stamp}`;
      if (encrypt) {
        const env = await encryptPackage(plain, pw, format === "csv" ? "text/csv" : "application/json");
        download(`${base}.${format}.encrypted.json`, JSON.stringify(env, null, 2), "application/json");
      } else {
        download(`${base}.${format}`, plain, format === "csv" ? "text/csv" : "application/json");
      }
      /* Log time, format, count and whether it was encrypted. Never the content, the password or a key. */
      const entry: ExportLogEntry = { at: Date.now(), format, records: records.length, encrypted: encrypt };
      const next = [entry, ...readJson<ExportLogEntry[]>(KEYS.exportLog, [])].slice(0, 20);
      writeJson(KEYS.exportLog, next);
      setLog(next);
      setPw("");
      setPwTouched(false);
      toast({ title: "Package prepared", body: `${records.length} record${records.length === 1 ? "" : "s"}${encrypt ? ", encrypted" : ""}. Check your downloads.`, tone: "success" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The package could not be prepared.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-32 font-semibold">Disclosure package</h1>
        <p className="text-16 text-muted prose-measure">Prepare a record of your own activity for an auditor or tax advisor. A cryptographic view key is offered only if the underlying protocol provides one.</p>
      </div>
      <Notice tone="warning" title="No view-only key">
        {NO_VIEW_KEY_BANNER}
      </Notice>

      {count === null ? (
        <StatementSkeleton rows={3} label="Loading activity" />
      ) : count === 0 ? (
        <EmptyState title="Nothing to disclose yet" action={<Link href="/app/shield/" className={buttonClass("primary", "md")}>Shield mock USDG</Link>}>
          A package is built from your activity. Do a mock shield first.
        </EmptyState>
      ) : (
        <Panel as="section" aria-labelledby="prep-h" className="flex max-w-form flex-col gap-6 p-6">
          <h2 id="prep-h" className="text-20 font-medium">
            Prepare a package
          </h2>
          <RadioGroup
            legend="Which activity"
            name="range"
            value={range}
            onChange={setRange}
            options={[
              { value: "all", label: "All mock activity", hint: `${count} record${count === 1 ? "" : "s"}` },
              { value: "30d", label: "Last 30 days" },
              { value: "7d", label: "Last 7 days" },
            ]}
          />
          <RadioGroup
            legend="Format"
            name="format"
            value={format}
            onChange={setFormat}
            options={[
              { value: "csv", label: "CSV", hint: "Opens in a spreadsheet. Formula characters are neutralised." },
              { value: "json", label: "JSON", hint: "Structured, for tools." },
            ]}
          />
          <Switch label="Encrypt with a password" checked={encrypt} onChange={setEncrypt} hint="Recommended. Share the password with your advisor by a different channel." />
          {encrypt && (
            <Field label="Password" hint="At least 12 characters. It is not stored anywhere. If you lose it, the file cannot be opened." error={pwTouched ? pwError : null} counter={{ value: pw.length, max: 256 }}>
              {({ id, describedBy, invalid }) => (
                <Input id={id} type="password" autoComplete="new-password" value={pw} invalid={invalid} aria-describedby={describedBy || undefined} onChange={(e) => setPw(e.target.value)} onBlur={() => setPwTouched(true)} />
              )}
            </Field>
          )}
          <Statement label="What goes in">
            <Row label="Columns" value="Date, action, amount, fee, public hash, commitment, counterparty" />
            <Row label="Encryption" value={encrypt ? `AES-GCM 256, key from PBKDF2-SHA-256 (${KDF.iterations.toLocaleString("en-US")} rounds)` : "None"} />
            <Row label="Where it goes" value="Your downloads folder only" />
          </Statement>
          {err && <ErrorState title="Package not prepared" what={err} funds="Nothing was shared or uploaded." next="Fix the issue and try again." onRetry={prepare} />}
          <div>
            <Button variant="primary" onClick={prepare} loading={busy} loadingLabel="Preparing" disabled={!regionAllows} icon={<Download aria-hidden className="size-4" />}>
              Prepare package
            </Button>
          </div>
        </Panel>
      )}

      <OpenPackage />

      <Panel as="section" aria-labelledby="log-h" className="flex flex-col gap-4 p-6">
        <h2 id="log-h" className="text-20 font-medium">
          Export log
        </h2>
        <p className="text-14 text-muted">When you prepared packages. Only the time, format and count are kept, never the content or password.</p>
        {log.length === 0 ? (
          <p className="text-14 text-muted">No packages prepared yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {log.map((l) => (
              <li key={l.at} className="flex flex-wrap items-center justify-between gap-2 py-2 text-14">
                <span className="num text-muted">{formatDate(l.at)}</span>
                <span>
                  {l.format.toUpperCase()} · {l.records} record{l.records === 1 ? "" : "s"} · {l.encrypted ? "encrypted" : "not encrypted"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/** Lets you (or your advisor) check that an encrypted package opens. Nothing leaves the browser. */
function OpenPackage() {
  const [file, setFile] = useState<File | null>(null);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const open = async () => {
    if (!file) return setErr("Choose a file first.");
    setBusy(true);
    setErr(null);
    setOut(null);
    try {
      if (file.size > 2_000_000) throw new Error("That file is too large to be a disclosure package.");
      const env = parseEnvelope(await file.text());
      if (!env) throw new Error("This file is not an encrypted disclosure package.");
      setOut(await decryptPackage(env, pw));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not open the file.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel as="section" aria-labelledby="open-h" className="flex max-w-form flex-col gap-4 p-6">
      <h2 id="open-h" className="text-20 font-medium">
        Check a package opens
      </h2>
      <p className="text-14 text-muted">Decrypts in this browser only. Nothing is uploaded.</p>
      <FileInput label="Encrypted package" accept=".json,application/json" onFile={(f) => (setFile(f), setOut(null), setErr(null))} />
      <Field label="Package password">
        {({ id }) => <Input id={id} type="password" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} />}
      </Field>
      {err && (
        <p role="alert" className="text-14 text-danger">
          {err}
        </p>
      )}
      {out && (
        <div className="flex flex-col gap-2">
          <p className="inline-flex items-center gap-2 text-14 text-success" role="status">
            <FileCheck2 aria-hidden className="size-4" /> Opened. First lines:
          </p>
          <pre className="num max-h-[var(--h-preview)] overflow-auto rounded-md border border-line bg-bg p-3 text-12 text-muted">{out.split("\n").slice(0, 12).join("\n")}</pre>
        </div>
      )}
      <div>
        <Button onClick={open} loading={busy} loadingLabel="Opening">
          Open package
        </Button>
      </div>
    </Panel>
  );
}
