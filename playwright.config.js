import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./apps/demo/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:4174/agcess/", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
  webServer: {
    command: "npm run build && npm run preview -- --port 4174 --strictPort",
    env: { BASE_PATH: "/agcess/" },
    url: "http://127.0.0.1:4174/agcess/",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
