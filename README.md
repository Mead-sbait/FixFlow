# FixFlow

FixFlow is a maintenance request and workflow management platform. Users report issues, admins assign technicians, and technicians update progress until completion.

## Project structure

```text
FixFlow/
├── client/       # React + TypeScript + Redux Toolkit
├── server/       # Express + TypeScript + PostgreSQL + Socket.IO
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

1. Copy `.env.example` into `client/.env` and `server/.env` and set local values.
2. Create a PostgreSQL database named `fixflow`.
3. Install dependencies: `npm run install:all`.
4. Start both apps: `npm run dev`.

The client runs at `http://localhost:5173`; the API health check is at `http://localhost:3000/api/health`.

## Git workflow

- Never push directly to `main`.
- Create branches from the latest `main`, for example `feature/auth`.
- Open a Pull Request for every feature and request one teammate review.
- Do not commit `.env`, credentials, or `node_modules`.

