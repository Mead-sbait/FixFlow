# Authentication and user reporting

## Scope and screens

Mead's user workflow reuses the existing authentication and issue APIs. This branch adds the Arabic RTL client screens and the category-list endpoint; it does not implement admin assignment, technician actions, comments or notifications.

| Client path | Purpose |
| --- | --- |
| `/` | Guest sign-in/register links, or user dashboard with counts and five latest issues |
| `/register` | Name, email, password and password confirmation |
| `/login` | Sign in using the original password, never the database password hash |
| `/issues` | Authenticated user's issues, newest first |
| `/issues/new` | Create an issue using categories loaded from the API |
| `/issues/:id` | Full description, status, priority, location and creation date |

## Session and authorization

- Login returns `{ accessToken, user }`. Redux stores the token and user **in memory only**. Reloading, pasting a URL or opening a new tab loses the session and requires login again. There is no refresh-token flow.
- The Axios instance adds `Authorization: Bearer <accessToken>` to API requests while logged in. Logout clears Redux credentials.
- The server currently signs HS256 JWTs for **one hour**. Login expiration is hard-coded in the service; the optional environment expiry value is not currently used there.
- All issue routes, including categories, run `requireAuth` followed by `requireUser`. The latter reads the current role from MongoDB; only role `user` is permitted.
- The server gets `reporterId` from verified authentication, not the browser. List and detail queries are scoped to this reporter. Missing and inaccessible issue IDs both return 404.
- Client issue screens cancel pending requests on unmount and remount their data views when the session or detail ID changes. Client guards improve navigation; server checks provide authorization.
- The login screen aborts its pending request on unmount, ignores late success/error callbacks and prevents simultaneous submissions with a request ref. A delayed login response must not restore credentials after leaving that screen.
- Dashboard counts are calculated from the full issue-list response. There is no pagination or live socket refresh; use **Update summary** or revisit the page.

## API contract

Base URL: `http://localhost:3000/api` for local development. Errors use `{ "error": "Human-readable message", "code": "MACHINE_CODE" }`.

| Method and path | Request | Success | Expected errors |
| --- | --- | --- | --- |
| `POST /auth/register` | `{ name, email, password }` | 201: `{ id, name, email, role }` | 400 invalid fields, 409 duplicate email, 500 internal error |
| `POST /auth/login` | `{ email, password }` | 200: `{ accessToken, user: { id, name, email, role } }` | 400 invalid fields, 401 invalid credentials, 500 internal error |
| `GET /auth/me` | Bearer token | 200: `{ id, name, email, role }` | 401 missing/invalid token or missing account, 500 internal error |
| `GET /issues/categories` | Bearer token, user role | 200: `[{ id, name }]`, alphabetical by name, or `[]` | 401 authentication, 403 role, 500 internal error |
| `POST /issues` | Bearer token; issue input below | 201: created issue | 400 validation or `INVALID_CATEGORY`, 401 authentication, 403 role, 500 internal error |
| `GET /issues` | Bearer token, user role | 200: user's issue array or `[]`, ordered by `createdAt` then `_id`, descending | 401 authentication, 403 role, 500 internal error |
| `GET /issues/:id` | Bearer token, user role | 200: one owned issue | 404 malformed/missing/not-owned ID, 401 authentication, 403 role, 500 internal error |

`/issues/categories` is registered before `/issues/:id` so it is not treated as an issue ID. Categories come from the existing database; seed them with `npm run seed --prefix server` if needed.

### Validation

Registration: trimmed name 1-100 characters, valid trimmed/lowercase email, password at least 8 characters and at most 72 UTF-8 bytes. Password confirmation is a client-only check and is not sent. The server sets role `user`; role injection is rejected. Login uses the same email and password constraints.

Issue input is strict: title 1-200 characters, description 1-5000, location 1-200 (all trimmed), categoryId a 24-character hex ID that must exist, priority one of `low`, `medium`, `high`, `urgent` (server default `medium`). The UI always sends priority. Unknown fields, including status, reporterId and technicianId, are rejected.

Example request (replace categoryId with an actual category returned by the API):

```json
{
  "title": "Broken light",
  "description": "Room 204 light does not turn on.",
  "location": "Floor 2, room 204",
  "categoryId": "444444444444444444444444",
  "priority": "medium"
}
```

Example issue response (illustrative IDs and timestamps):

```json
{
  "id": "333333333333333333333333",
  "title": "Broken light",
  "description": "Room 204 light does not turn on.",
  "location": "Floor 2, room 204",
  "categoryId": "444444444444444444444444",
  "reporterId": "111111111111111111111111",
  "technicianId": null,
  "status": "open",
  "priority": "medium",
  "createdAt": "2026-10-13T08:00:00.000Z",
  "updatedAt": "2026-10-13T08:00:00.000Z"
}
```

Responses use string `id` rather than `_id`; password hashes and `__v` are not exposed. Creation starts with status `open` and no assigned technician. Account and issue forms have no automatic retry for writes. If a request times out, check whether it succeeded before submitting again; the API does not provide idempotency keys.

## Verification

From the repository root:

```sh
npm run build
npm run lint
npm test --prefix server
git diff --check
```

If the environment prevents the `tsx` runner from creating its IPC socket, run the compiled tests after building:

```sh
npm run build --prefix server
node --test server/dist/models/models.test.js server/dist/tests/user-reporting.test.js
```

The automated suite uses in-memory model instances and mocked database methods. It does **not** start MongoDB, write application data or replace a live integration/browser test. It covers validation, response projection, owner-scoped queries, missing categories, creation ownership, missing-token rejection and current-role checks. Existing model serialization tests are included.

Recorded verification on 2026-10-13: root build and lint passed; `git diff --check` passed. The normal test command was blocked by the local sandbox's `tsx` IPC permission error. The compiled-test fallback passed **20/20 tests** (17 user-reporting tests and 3 existing model tests). Existing Mongoose deprecation warnings and missing-environment warnings were printed; these mocked tests do not require a live database or signing secret.

### Manual checks recorded on 2026-10-13

These results are based on the user's local browser tests and screenshots, not an automated browser run.

| Scenario | Observed result |
| --- | --- |
| Register and log in with a new account | Success; user's name displayed |
| Incorrect password (database hash used instead of original password) | Login error displayed |
| Logout | User confirmed sign-in link returned |
| Empty account | Empty list and dashboard counts of zero |
| Create issue | Returned to list; saved issue displayed with open status |
| Required field missing | User confirmed form prevented submission |
| View owned issue | Full description and metadata displayed |
| Signed-out detail access | Redirected to login |
| Dashboard totals | Two issues, both open, matched the list |
| Switch to another account | Zero issues; first account's issues not displayed |
| Direct detail navigation as second account | Not-found/not-available message; no issue details exposed |

To repeat the last check, preserve the second account's current SPA session: use in-app navigation or a test tool to change the client route **without reloading**. Pasting the URL into the address bar loses this in-memory session and tests signed-out behavior instead. Never copy tokens, passwords or database hashes into screenshots or documentation.

### Still to verify

- Mobile-width layout and keyboard accessibility across all screens.
- Duplicate-email and password-confirmation messages in the browser.
- Expired-token, forbidden-role, server-offline, empty-category and deleted-category UI states.
- Full browser automation: attempted locally but the available browser runtime could not start. No automated browser pass is claimed.
- Browser-level delayed-login navigation check: unmount cancellation is now implemented. A local handler/cleanup simulation with mocked React hooks and HTTP passed normal success, duplicate-submit prevention, late-success cancellation, late-error suppression and normal invalid-login handling. This was a one-off simulation, not a mounted React/browser test or part of the server's 20-test suite. Repeat with a delayed response in browser testing before claiming full end-to-end coverage.

This feature has not been validated as a complete admin/technician integration or production-ready authentication system.
