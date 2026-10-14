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
  globalTeardown: process.env.E2E_UI_ONLY === '1' ? undefined : './e2e/global-teardown.ts',
  testMatch: process.env.E2E_UI_ONLY === '1' ? '**/ui.spec.ts' : '**/*.spec.ts',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  // one worker: the tests share one database and one socket server, and parallel runs
  // flood the board with events while another test is mid-drag
  fullyParallel: false,
  workers: 1,
  // browser tests get one retry: a drag or a socket round trip can be late without anything being broken
  retries: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_UI_ONLY === '1' ? 'http://127.0.0.1:5173' : 'http://localhost:5173',
    // uses the Chrome already installed on the machine, so there is nothing to download
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // the client and the API (with MongoDB) must be running: `npm run dev` in another terminal
  webServer: {
    command: process.env.E2E_UI_ONLY === '1' ? 'node client/node_modules/vite/bin/vite.js client --host 127.0.0.1' : 'npm run dev --prefix client',
    url: process.env.E2E_UI_ONLY === '1' ? 'http://127.0.0.1:5173' : 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
