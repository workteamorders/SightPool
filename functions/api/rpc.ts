import { handleRpc, type RpcEnv } from "../../src/server/rpc";

/* Cloudflare Pages Function: POST /api/rpc, read-only relay for chain 4663. */
export const onRequest = (ctx: { request: Request; env: RpcEnv }): Promise<Response> => handleRpc(ctx.request, ctx.env);
