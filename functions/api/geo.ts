import { handleGeo, type GeoEnv } from "../../src/server/geo";

/* Cloudflare Pages Function: GET /api/geo → { country, blocked, reason }. */
export const onRequest = (ctx: { request: Request; env: GeoEnv }): Response => handleGeo(ctx.request, ctx.env);
