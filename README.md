# FixFlow

FixFlow is a maintenance request and workflow management platform. Users report issues, admins assign technicians, and technicians update progress until completion.

## Project structure

```text
FixFlow/
├── client/       # React + TypeScript + Redux Toolkit
├── server/       # Express + TypeScript + MongoDB/Mongoose + Socket.IO
├── .env.example  # Required environment-variable reference
└── README.md
```

## Team ownership

| Member | Area |
| --- | --- |
| MEAD | Team lead, GitHub integration, authentication and user reporting |
| kream | Admin dashboard, filters, assignment, statistics |
| Mohammad | Technician workflow, comments, notifications, Socket.IO |

## First-time setup

1. Use Node.js 22.12+ and npm. Run all commands below from the project root.
2. Install dependencies: `npm ci` then `npm run install:all`.
3. Copy `client/.env.example` to `client/.env`, and `server/.env.example` to `server/.env`.
4. Run a local MongoDB instance or use a MongoDB Atlas cluster. Set `MONGODB_URI` in `server/.env` to your connection string, including the `fixflow` database name. The example targets local MongoDB; it does not install or start it. Set your own `JWT_SECRET` too. Never put database credentials in the client environment.
5. Seed the default categories: `npm run seed --prefix server`. This can be repeated without duplicating categories. If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `server/.env`, the same command also creates the first admin account (registration only creates normal users). Other admins and technicians are then promoted from the `/admin/users` page.
6. Start both apps: `npm run dev`. The backend starts listening only after MongoDB connects.

The client runs at `http://localhost:5173`; the API health check is at `http://localhost:3000/api/health`.

`npm test` runs the client tests (vitest) and the server tests (node:test). Neither needs MongoDB running.

## Client

The interface is one "dispatch whiteboard": every issue is a strip, assigning is moving it into a technician's column. All styling lives in `client/src/styles.css` (tokens at the top), icons are inline SVG in `client/src/components/Icon.tsx`, the font is Atkinson Hyperlegible from Google Fonts.

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

### Languages

The interface comes in English, Hebrew and Arabic. The switch is in the top frame and on the login page; the choice is saved in `localStorage` under `fixflow.lang`, and the first visit follows the browser language. Hebrew and Arabic flip the whole page to right-to-left (`dir="rtl"` on `<html>`), the stylesheet uses logical properties so nothing else is needed per page.

All text lives in `client/src/i18n/en.ts`, `he.ts` and `ar.ts` as one flat key list; components call `t('key')` from `useT()`. A unit test fails if a language is missing a key or a placeholder. API error messages are still English, they come from the server.

## QA

Three layers, all run from the project root:

| Command | What it covers | Needs |
| --- | --- | --- |
| `npm test` | client unit tests (vitest: admin slice, socket wiring, translations) and server unit tests (node:test: validators, filters, status rules, socket rooms) | nothing running |
| `npm run test:e2e` | Playwright, drives the real app in Chrome: register, sign in, role guards, report an issue, admin board drag and drop and the strip menu, list actions, people page, technician start / comment / complete, live socket updates, language switching and RTL, phone layouts | the app running (`npm run dev`), the seeded admin from `server/.env`, Google Chrome installed |
| `npm run lint` and `npm run build` | types and style on both sides | nothing running |

The e2e suite creates its own throwaway accounts (`*@e2e.local`) through the API, so it can run against a development database any number of times. Reports and traces for failed runs land in `test-results/`.

## Admin area

The admin pages are `/admin` (issue queue, also reachable as `/admin/issues`), `/admin/users` and `/admin/statistics`. They send the JWT from the Redux auth state as a bearer token. Every admin route checks the token and then looks the account up in MongoDB to confirm it still has the `admin` role.

Routes under `/api/admin`:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/issues` | Paginated issue list with search, status, priority, category and technician filters (`technicianId=unassigned` for issues without one) |
| `PATCH` | `/issues/:id/assign` | Assign or reassign a technician, open issues become assigned |
| `PATCH` | `/issues/:id/priority` | Change priority (refused with 409 on completed/cancelled issues) |
| `PATCH` | `/issues/:id/status` | `cancelled` for an active issue, `open` to reopen a closed one (goes back to `assigned` if a technician is set) |
| `GET` | `/technicians` | Technician choices for assignment |
| `GET` | `/stats` | Counts by status, urgent and unassigned, plus per-category and per-technician breakdowns |
| `GET` | `/users` | List accounts, filter by `role` and `search` |
| `PATCH` | `/users/:id/role` | Change an account role (not your own) |

Categories are not admin-only: `GET /api/categories` works for any logged in user and is used by the issue form and the admin filters.

## Database foundation

Mongoose models in `server/src/models/index.ts` define users, categories, issues, comments, status history, and notifications. MongoDB replaces the SQL design from the original proposal; there are no SQL migrations to run and no existing application data has been migrated.

References use ObjectIds, and API IDs must be strings. Document JSON exposes `id` and hides `_id`, `__v`, and password hashes. Avoid returning raw `lean()` results without an explicit response mapper. Authentication queries must explicitly select `passwordHash` when comparing passwords.

MongoDB references do not enforce foreign keys. Feature services must validate referenced records, technician roles, ownership, internal-note visibility, and allowed status transitions. Use `runValidators: true` with update queries. Workflow updates spanning multiple documents should use transactions on Atlas or a local replica set, and emit socket events only after commit. These feature services are not implemented by this skeleton.

Connection reference: https://mongoosejs.com/docs/connections.html

## Real-time events

Socket.IO connections must send the JWT as `auth: { token }` in the client handshake, otherwise the connection is refused. The server verifies the token, then reads the account's current role from MongoDB (not from the token) before joining rooms: every user gets a private `user:<id>` room and admins also join the shared `admins` room. Changing a role from the users page moves that account's open connections in or out of `admins` straight away.

Events are emitted only after the database change is committed, through `server/src/sockets/emitter.ts`:

| Event | Payload | Sent to |
| --- | --- | --- |
| `issue:created` | `{ issueId }` | admins |
| `issue:assigned` | `{ issueId }` | admins, reporter, new technician, and the previous technician if there was one |
| `issue:updated` | `{ issueId }` | admins, reporter, technician |
| `notification:new` | `{ notificationId }` | the account the notification belongs to |

Clients refetch from the REST API when they receive an event; the payload only says which record changed.

## Git workflow

- Never push directly to `main`.
- Create branches from the latest `main`, for example `feature/auth`.
- Open a Pull Request for every feature and request one teammate review.
- Do not commit `.env`, credentials, or `node_modules`.
