import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  // WebGL por software pesa na CPU: em paralelo os testes estouram o tempo.
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    // WebGL por software no headless (sem GPU).
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
