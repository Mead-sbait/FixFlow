import { defineConfig } from '@playwright/test'
import { readFileSync } from 'node:fs'

// the admin account the tests use comes from server/.env (ADMIN_EMAIL / ADMIN_PASSWORD),
// the same values `npm run seed` used to create it
function readServerEnv() {
  const values: Record<string, string> = {}
  try {
    for (const line of readFileSync('server/.env', 'utf8').split('\n')) {
      const match = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(line)
      if (match && !line.trim().startsWith('#')) values[match[1]] = match[2]
    }
  } catch {
    // no server/.env, the defaults below apply
  }
  return values
}

const serverEnv = readServerEnv()
process.env.E2E_ADMIN_EMAIL ??= serverEnv.ADMIN_EMAIL ?? 'admin@fixflow.local'
process.env.E2E_ADMIN_PASSWORD ??= serverEnv.ADMIN_PASSWORD ?? 'change-this-password'
process.env.E2E_API ??= 'http://localhost:3000/api'

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    // uses the Chrome already installed on the machine, so there is nothing to download
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // the client and the API (with MongoDB) must be running: `npm run dev` in another terminal
  webServer: {
    command: 'npm run dev --prefix client',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
