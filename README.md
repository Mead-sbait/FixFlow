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
5. Seed the default categories: `npm run seed --prefix server`. This can be repeated without duplicating categories.
6. Start both apps: `npm run dev`. The backend starts listening only after MongoDB connects.

The client runs at `http://localhost:5173`; the API health check is at `http://localhost:3000/api/health`.

## Database foundation

Mongoose models in `server/src/models/index.ts` define users, categories, issues, comments, status history, and notifications. MongoDB replaces the SQL design from the original proposal; there are no SQL migrations to run and no existing application data has been migrated.

References use ObjectIds, and API IDs must be strings. Document JSON exposes `id` and hides `_id`, `__v`, and password hashes. Avoid returning raw `lean()` results without an explicit response mapper. Authentication queries must explicitly select `passwordHash` when comparing passwords.

MongoDB references do not enforce foreign keys. Feature services must validate referenced records, technician roles, ownership, internal-note visibility, and allowed status transitions. Use `runValidators: true` with update queries. Workflow updates spanning multiple documents should use transactions on Atlas or a local replica set, and emit socket events only after commit. These feature services are not implemented by this skeleton.

Connection reference: https://mongoosejs.com/docs/connections.html

## Git workflow

- Never push directly to `main`.
- Create branches from the latest `main`, for example `feature/auth`.
- Open a Pull Request for every feature and request one teammate review.
- Do not commit `.env`, credentials, or `node_modules`.
