import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  workers: 3,
  use: {
    baseURL: "http://127.0.0.1:4184",
    channel: "chrome",
    viewport: { width: 1083, height: 896 },
    locale: "ja-JP",
    colorScheme: "light",
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "PORT=4184 node scripts/serve.mjs",
    url: "http://127.0.0.1:4184",
    reuseExistingServer: true,
  },
});
