import type { DisclosureRecord } from "./pool/types";

/**
 * Disclosure package: a record of your own activity, assembled by you. It is not a cryptographic view key.
 * Optional password encryption uses WebCrypto: PBKDF2-SHA-256 (310,000 iterations, 16-byte salt) derives an
 * AES-GCM-256 key; the IV is 12 random bytes. Parameters are written into the envelope so it can be opened later.
 * The password and derived key are never stored or logged.
 */
export const KDF = { name: "PBKDF2", hash: "SHA-256", iterations: 310_000, saltBytes: 16 } as const;
export const CIPHER = { name: "AES-GCM", length: 256, ivBytes: 12 } as const;
export const NO_VIEW_KEY_BANNER =
  "This protocol build does not offer a view-only key. This package is a user-assembled record, not a cryptographic view key.";

const COLUMNS: (keyof DisclosureRecord)[] = ["date", "kind", "amount", "fee", "publicHash", "commitment", "counterparty", "label"];

const csvCell = (v: string) => {
  /* Neutralise spreadsheet formula injection and quote everything. */
  const cell = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${cell.replace(/"/g, '""')}"`;
};

export function toCsv(records: DisclosureRecord[], meta: { generatedAt: string; product: string }): string {
  const head = [
    `# ${meta.product} disclosure package (mock data). Generated ${meta.generatedAt}.`,
    `# ${NO_VIEW_KEY_BANNER}`,
  ];
  const rows = records.map((r) => COLUMNS.map((c) => csvCell(String(r[c]))).join(","));
  return [...head, COLUMNS.join(","), ...rows].join("\n") + "\n";
}

export function toJson(records: DisclosureRecord[], meta: { generatedAt: string; product: string }): string {
  return JSON.stringify(
    { kind: "disclosure-package", label: "mock", product: meta.product, generatedAt: meta.generatedAt, notice: NO_VIEW_KEY_BANNER, records },
    null,
    2,
  );
}

export interface Envelope {
  kind: "encrypted-disclosure-package";
  v: 1;
  kdf: { name: "PBKDF2"; hash: "SHA-256"; iterations: number; salt: string };
  cipher: { name: "AES-GCM"; length: 256; iv: string };
  contentType: "text/csv" | "application/json";
  ciphertext: string;
}

const b64 = (u: Uint8Array) => {
  let s = "";
  for (const b of u) s += String.fromCharCode(b);
  return btoa(s);
};
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < 12) return "Use at least 12 characters.";
  if (pw.length > 256) return "Use at most 256 characters.";
  return null;
}

export async function encryptPackage(plain: string, password: string, contentType: Envelope["contentType"]): Promise<Envelope> {
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);
  const salt = crypto.getRandomValues(new Uint8Array(KDF.saltBytes));
  const iv = crypto.getRandomValues(new Uint8Array(CIPHER.ivBytes));
  const key = await deriveKey(password, salt, KDF.iterations);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, new TextEncoder().encode(plain)));
  return {
    kind: "encrypted-disclosure-package",
    v: 1,
    kdf: { name: "PBKDF2", hash: "SHA-256", iterations: KDF.iterations, salt: b64(salt) },
    cipher: { name: "AES-GCM", length: 256, iv: b64(iv) },
    contentType,
    ciphertext: b64(ct),
  };
}

export async function decryptPackage(envelope: Envelope, password: string): Promise<string> {
  if (envelope.kind !== "encrypted-disclosure-package" || envelope.v !== 1) throw new Error("This file is not an encrypted disclosure package.");
  if (envelope.kdf.iterations < 100_000 || envelope.kdf.iterations > 5_000_000) throw new Error("Unsupported key-derivation settings.");
  const key = await deriveKey(password, unb64(envelope.kdf.salt), envelope.kdf.iterations);
  try {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(envelope.cipher.iv) as BufferSource }, key, unb64(envelope.ciphertext) as BufferSource);
    return new TextDecoder().decode(pt);
  } catch {
    throw new Error("Wrong password, or the file was changed.");
  }
}

export function parseEnvelope(text: string): Envelope | null {
  try {
    const j = JSON.parse(text) as Partial<Envelope>;
    if (j && j.kind === "encrypted-disclosure-package" && j.v === 1 && j.kdf && j.cipher && typeof j.ciphertext === "string") return j as Envelope;
    return null;
  } catch {
    return null;
  }
}

/** Export log entry: time, format, count and whether it was encrypted. No content, no password, no key. */
export interface ExportLogEntry {
  at: number;
  format: "csv" | "json";
  records: number;
  encrypted: boolean;
}
