import { SELECTORS } from "../../config/abis";

/**
 * Tiny read-only JSON-RPC client for public pages (no wallet library). Talks only to /api/rpc.
 * Every function returns null on any failure so the UI shows a dash instead of a made-up number.
 */
let id = 0;
export async function rpc<T = string>(method: string, params: unknown[] = []): Promise<T | null> {
  try {
    const res = await fetch("/api/rpc", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { result?: T; error?: unknown };
    return j.error || j.result === undefined ? null : j.result;
  } catch {
    return null;
  }
}

const pad = (addr: string) => addr.toLowerCase().replace(/^0x/, "").padStart(64, "0");

export const readChainId = () => rpc<string>("eth_chainId");
export const readBlockNumber = async () => {
  const r = await rpc<string>("eth_blockNumber");
  return r && /^0x[0-9a-f]+$/i.test(r) ? BigInt(r) : null;
};
export const readHasCode = async (address: string) => {
  const r = await rpc<string>("eth_getCode", [address, "latest"]);
  return r === null ? null : r !== "0x" && r.length > 2;
};
export const readUint = async (to: string, data: string) => {
  const r = await rpc<string>("eth_call", [{ to, data }, "latest"]);
  return r && /^0x[0-9a-f]{64}$/i.test(r) ? BigInt(r) : null;
};
export const readBool = async (to: string, data: string) => {
  const v = await readUint(to, data);
  return v === null ? null : v !== 0n;
};
export const readLastRoot = async (pool: string) => {
  const r = await rpc<string>("eth_call", [{ to: pool, data: SELECTORS.getLastRoot }, "latest"]);
  return r && /^0x[0-9a-f]{64}$/i.test(r) ? r : null;
};
export const readErc20Balance = (token: string, owner: string) => readUint(token, SELECTORS.balanceOf + pad(owner));
export const readAllowance = (token: string, owner: string, spender: string) => readUint(token, SELECTORS.allowance + pad(owner) + pad(spender));
export const readPaused = (token: string) => readBool(token, SELECTORS.paused);
export const readIsFrozen = (token: string, addr: string) => readBool(token, SELECTORS.isFrozen + pad(addr));
