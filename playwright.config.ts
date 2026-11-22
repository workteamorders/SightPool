import { defineConfig } from "@playwright/test";

/* E2E runs against the static export (pnpm build first) through e2e/serve.cjs, which emulates the Pages Functions. */
const server = (port: number, env: Record<string, string>) => ({
  command: `node e2e/serve.cjs`,
  port,
  reuseExistingServer: false,
  env: { PORT: String(port), ...env },
});

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  fullyParallel: false,
  workers: 2,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4273", channel: undefined, launchOptions: { executablePath: process.env.CHROME_PATH || undefined } },
  webServer: [
    server(4273, { FAKE_COUNTRY: "ID", UPSTREAM: "fixture" }),
    server(4274, { FAKE_COUNTRY: "US", UPSTREAM: "fixture" }),
    server(4275, { FAKE_COUNTRY: "", UPSTREAM: "fixture" }),
    server(4276, { FAKE_COUNTRY: "IR", RESTRICTED_REGION_LIST: "IR,KP", UPSTREAM: "" }),
  ],
});
