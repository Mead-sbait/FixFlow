# Client, languages and QA

Notes for the interface in `client/` and the test commands. The main README stays the project overview; this file is the hands-on part.

## The interface

The interface is one "dispatch whiteboard": every issue is a strip, assigning is moving it into a technician's column. All styling lives in `client/src/styles.css` (tokens at the top), icons are inline SVG in `client/src/components/Icon.tsx`, fonts are self-hosted under `client/public/fonts`.

| Route | Who | What |
| --- | --- | --- |
| `/login`, `/register` | public | sign in, or create a reporter account |
| `/dashboard` | user | my issues, filter active / done |
| `/issues/new` | user | report an issue |
| `/issues/:id` | user | one issue with its status line |
| `/technician` | technician | my column: assigned and in progress jobs |
| `/technician/issues/:id` | technician | start / complete, comments and internal notes |
| `/admin` | admin | the board: drag strips between technician columns, or use the menu on each strip |
| `/admin/issues` | admin | every issue as a table with filters and paging |
| `/admin/users` | admin | change roles |
| `/admin/statistics` | admin | tally by status, category and technician |

The session (token + user) is kept in `localStorage` under `fixflow.session` so a refresh does not log you out. One Socket.IO connection per session (`useRealtimeSocket`) refreshes whatever the current role is looking at.

## Languages

The interface comes in English, Hebrew and Arabic. The switch is in the top frame and on the login page; the choice is saved in `localStorage` under `fixflow.lang`, and the first visit follows the browser language. Hebrew and Arabic flip the whole page to right-to-left (`dir="rtl"` on `<html>`); the stylesheet uses logical properties so nothing else is needed per page.

All text lives in `client/src/i18n/en.ts`, `he.ts` and `ar.ts` as one flat key list; components call `t('key')` from `useT()`. A unit test fails if a language is missing a key or a placeholder. API error messages are still English, they come from the server.

## QA

Three layers, all run from the project root:

| Command | What it covers | Needs |
| --- | --- | --- |
| `npm test` | client unit tests (vitest: admin slice, socket wiring, translations) and server unit tests (node:test: validators, filters, status rules, socket rooms, cleanup safety) | nothing running |
| `npm run test:e2e` | Playwright, drives the real app in Chrome: register, sign in, role guards, report an issue, admin board drag and drop and the strip menu, list actions, people page, technician start / comment / complete, live socket updates, language switching and RTL, phone layouts | the app running (`npm run dev`), the seeded admin from `server/.env`, Google Chrome installed |
| `npm run lint` and `npm run build` | types and style on both sides | nothing running |

The e2e suite runs one test at a time (they share one database and one socket server) and creates its own throwaway accounts (`*@e2e.local`) through the API. When the run ends it deletes those accounts and everything they created, so it can run against a development database any number of times; `npm run cleanup:e2e --prefix server` does the same by hand.

The cleanup only runs against a local MongoDB or a database whose name contains `test` or `e2e`. Anything else is refused, and it never runs when `NODE_ENV=production`. For a remote test database that is named differently, set `ALLOW_E2E_CLEANUP=yes` on purpose. Reports and traces for failed runs land in `test-results/`.
