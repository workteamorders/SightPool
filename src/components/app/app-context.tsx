"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MockPoolClient, type MockStore } from "@/lib/pool/mock";
import { MockScreeningAdapter } from "@/lib/screening";
import type { Balances } from "@/lib/pool/types";
import { KEYS, readJson, removeKey, writeJson } from "@/lib/storage";
import { interpretGeoPayload, type GeoAnswer } from "@/server/geo";
import { config } from "@config/env";

export type GeoState = { status: "loading" } | ({ status: "done" } & GeoAnswer);

export interface TosRecord {
  version: string;
  acceptedAt: number;
}

interface AppState {
  client: MockPoolClient;
  screening: MockScreeningAdapter;
  balances: Balances | null;
  refresh: () => Promise<void>;
  /** Bumps whenever activity changes, so lists re-read. */
  version: number;
  geo: GeoState;
  /** True when actions are allowed in this region (fails closed while loading or on error). */
  regionAllows: boolean;
  viewOnlyChosen: boolean;
  chooseViewOnly: () => void;
  recheckGeo: () => void;
  tos: TosRecord | null;
  acceptTos: () => void;
  /** Opens the Terms gate; resolves true if accepted. */
  requireTos: () => Promise<boolean>;
  tosOpen: boolean;
  setTosOpen: (v: boolean) => void;
  resetMock: () => void;
}

const Ctx = createContext<AppState | null>(null);
export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside AppProvider");
  return v;
}

const localStore: MockStore = {
  load: () => {
    try {
      return window.localStorage.getItem(KEYS.mockState);
    } catch {
      return null;
    }
  },
  save: (s) => {
    try {
      window.localStorage.setItem(KEYS.mockState, s);
    } catch {
      /* storage unavailable: memory only */
    }
  },
  clear: () => removeKey(KEYS.mockState),
};

export function AppProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<MockPoolClient | null>(null);
  const screeningRef = useRef<MockScreeningAdapter | null>(null);
  if (!clientRef.current) clientRef.current = new MockPoolClient(typeof window === "undefined" ? undefined : localStore);
  if (!screeningRef.current) screeningRef.current = new MockScreeningAdapter();
  const client = clientRef.current;

  const [balances, setBalances] = useState<Balances | null>(null);
  const [version, setVersion] = useState(0);
  const [geo, setGeo] = useState<GeoState>({ status: "loading" });
  const [viewOnlyChosen, setViewOnlyChosen] = useState(false);
  const [tos, setTos] = useState<TosRecord | null>(null);
  const [tosOpen, setTosOpenState] = useState(false);
  const pending = useRef<((v: boolean) => void) | null>(null);

  const refresh = useCallback(async () => {
    setBalances(await client.balances());
    setVersion((v) => v + 1);
  }, [client]);

  const recheckGeo = useCallback(() => {
    setGeo({ status: "loading" });
    fetch("/api/geo", { cache: "no-store", signal: AbortSignal.timeout(6000) })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((p: unknown) => setGeo({ status: "done", ...interpretGeoPayload(p) }));
  }, []);

  useEffect(() => {
    void refresh();
    recheckGeo();
    const t = readJson<TosRecord | null>(KEYS.tos, null);
    if (t && t.version === config.tosVersion) setTos(t);
  }, [refresh, recheckGeo]);

  const acceptTos = useCallback(() => {
    const rec = { version: config.tosVersion, acceptedAt: Date.now() };
    writeJson(KEYS.tos, rec);
    setTos(rec);
    setTosOpenState(false);
    pending.current?.(true);
    pending.current = null;
  }, []);

  const setTosOpen = useCallback((v: boolean) => {
    setTosOpenState(v);
    if (!v && pending.current) {
      pending.current(false);
      pending.current = null;
    }
  }, []);

  const requireTos = useCallback(() => {
    if (tos && tos.version === config.tosVersion) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => {
      pending.current = resolve;
      setTosOpenState(true);
    });
  }, [tos]);

  const resetMock = useCallback(() => {
    client.reset();
    removeKey(KEYS.drafts);
    void refresh();
  }, [client, refresh]);

  const regionAllows = geo.status === "done" && !geo.blocked;

  const value = useMemo<AppState>(
    () => ({
      client,
      screening: screeningRef.current as MockScreeningAdapter,
      balances,
      refresh,
      version,
      geo,
      regionAllows,
      viewOnlyChosen,
      chooseViewOnly: () => setViewOnlyChosen(true),
      recheckGeo,
      tos,
      acceptTos,
      requireTos,
      tosOpen,
      setTosOpen,
      resetMock,
    }),
    [client, balances, refresh, version, geo, regionAllows, viewOnlyChosen, recheckGeo, tos, acceptTos, requireTos, tosOpen, setTosOpen, resetMock],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
