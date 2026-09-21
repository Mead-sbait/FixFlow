<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Cairo&size=30&pause=1000&color=0EA5E9&center=true&vCenter=true&width=800&lines=FixFlow;Maintenance+Request+Management;Report+%7C+Assign+%7C+Track+%7C+Resolve" alt="FixFlow — Maintenance Request Management" />
</p>

<p align="center">
  A role-based platform for reporting, assigning, and tracking maintenance requests.
  <br />
  Full-Stack Capstone Project · NewTech Coding Bootcamp
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-In%20Development-F59E0B?style=for-the-badge" alt="In Development" />
  <img src="https://img.shields.io/badge/Stack-MERN-0EA5E9?style=for-the-badge" alt="MERN Stack" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## 📖 About

FixFlow centralizes maintenance requests for offices, schools, apartment buildings, and small facilities teams.

Instead of tracking issues across calls, messages, and spreadsheets, the platform provides one shared place to report problems, assign work, follow progress, and preserve maintenance history.

A **User** reports an issue, an **Admin** prioritizes and assigns it, and a **Technician** handles the work until completion. Relevant participants receive updates through persistent notifications and Socket.IO.

The project uses **MongoDB with Mongoose** to store accounts, maintenance requests, comments, status history, and notifications.

> **Development status:** The current skeleton includes the database foundation. The capabilities below describe the intended v1 scope; feature services and workflow enforcement are not yet implemented by the skeleton.

## 🎯 Version 1 Scope

The first release focuses on **one organization** and **at most one assigned technician per issue**.

The primary goal is to demonstrate a complete maintenance lifecycle inside FixFlow, with correct permissions, recorded history, and live updates.

The following are outside the v1 scope:

- Payments, invoicing, and salaries
- Inventory, spare parts, and supplier management
- Native mobile apps and technician GPS tracking
- AI diagnosis and repair recommendations
- Multi-tenant architecture
- Multiple technicians assigned to one issue

## 👤 Roles and Responsibilities

| Role | Intended capabilities |
| --- | --- |
| **User** | Register, report maintenance issues, view their own requests, add public comments, and receive updates |
| **Technician** | View assigned jobs, update allowed statuses, add comments, and write internal maintenance notes |
| **Admin** | View all issues, change priorities, assign technicians, filter requests, manage users, and view statistics |

Self-registration creates a **User** account only. Privileged roles must be managed through authorized administrative actions.

Role and ownership checks belong on the server, in addition to role-aware navigation and protected frontend routes.

## ✨ Planned Features

- **Authentication** — Registration and login using bcrypt password hashing and JWT authentication.
- **Issue reporting** — Requests with a title, description, category, location, and priority.
- **Personal dashboards** — Views for reported issues and assigned technician jobs.
- **Admin management** — Assignment, priority updates, and request management.
- **Search and filtering** — Filter by status, priority, category, technician, and text.
- **Maintenance statistics** — Counts for open, in-progress, completed, and urgent issues.
- **Comments and internal notes** — Public discussion and restricted maintenance notes.
- **Status history** — Every status change records its actor and timestamp.
- **Persistent notifications** — In-app notifications with read/unread state.
- **Real-time updates** — Targeted assignment, status, comment, and notification events.
- **Responsive UI** — Main workflows designed for desktop and mobile, including 360px-wide screens.

## 🔄 Issue Lifecycle

```text
open → assigned → in_progress → completed
```

`cancelled` is also a defined status. The design proposes cancellation paths from `open` and `assigned`; exact permissions, including whether a reporter may cancel after assignment, remain to be finalized.

| Priority | Value |
| --- | --- |
| Low | `low` |
| Medium | `medium` |
| High | `high` |
| Urgent | `urgent` |

The backend must validate every transition. Status controls in the UI should reflect the same rules.

Reopening completed issues, technician rejection, editing after assignment, and image uploads remain open design decisions.

## 🛠️ Technology Stack

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white" alt="Redux Toolkit" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white" alt="Mongoose" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO" />
</p>

| Layer | Technology |
| --- | --- |
| Frontend | React + TypeScript |
| Shared state | Redux Toolkit |
| Routing — planned | React Router |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB + Mongoose |
| Authentication — planned | bcrypt + JWT |
| Real-time communication | Socket.IO |
| Code quality — planned | ESLint + Prettier |

## 🏗️ Architecture

```text
React + TypeScript + Redux Toolkit
          │                ▲
     REST requests    Socket.IO events
          ▼                │
       Express API + Socket.IO
          │
   Mongoose models
          │
          ▼
        MongoDB
```

- The frontend communicates with the backend through REST and Socket.IO.
- The backend handles authentication, authorization, validation, and business rules.
- Only the backend accesses MongoDB.
- MongoDB remains the source of truth.
- Socket.IO informs authorized clients about committed changes; Redux updates local state or refetches data when needed.

## 📂 Project Structure

```text
FixFlow/
├── client/          # React + TypeScript + Redux Toolkit
│   └── .env.example # Client environment reference
├── server/          # Express + TypeScript + MongoDB + Socket.IO
│   └── .env.example # Server environment reference
├── .env.example     # Required environment-variable reference
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 22.12+**
- **npm**
- A running local MongoDB instance or a MongoDB Atlas cluster

Run all commands below from the project root.

### 1. Install dependencies

```bash
npm ci
npm run install:all
```

### 2. Configure environment variables

Copy:

```text
client/.env.example → client/.env
server/.env.example → server/.env
```

Set the following in `server/.env`:

- `MONGODB_URI`: Your MongoDB connection string, including the `fixflow` database name.
- `JWT_SECRET`: Your own secret for signing authentication tokens.

Use the repository’s environment example files as the configuration reference.

The example configuration targets local MongoDB. It does not install or start the database.

> Never place database credentials in the client environment or commit `.env` files.

### 3. Seed default categories

```bash
npm run seed --prefix server
```

This command can be repeated without duplicating categories.

### 4. Start both applications

```bash
npm run dev
```

The backend starts listening only after MongoDB connects successfully.

| Service | Local URL |
| --- | --- |
| Frontend | [http://localhost:5173](http://localhost:5173) |
| API health check | [http://localhost:3000/api/health](http://localhost:3000/api/health) |

## 🗄️ Database Foundation

The project uses **MongoDB** for persistence and **Mongoose** for schema definitions, validation, and document relationships.

Mongoose models are defined in `server/src/models/index.ts`.

| Entity | Purpose |
| --- | --- |
| Users | Accounts, credentials, and roles |
| Categories | Maintenance request classification |
| Issues | Request details, reporter, assigned technician, priority, and status |
| Comments | Public comments and internal maintenance notes |
| Status history | Workflow changes with actor and timestamp |
| Notifications | Persistent updates for individual recipients |

Each issue has one reporter, one category, and zero or one assigned technician. Related comments, history records, and notifications reference the issue.

### MongoDB conventions

- Relationships use `ObjectId` references; API IDs must be strings.
- Document JSON exposes `id` and hides `_id`, `__v`, and password hashes.
- Raw `lean()` results require an explicit response mapper.
- Authentication queries must explicitly select `passwordHash` when comparing passwords.
- Update queries must use `runValidators: true`.

### Data integrity and workflow updates

Feature services must validate that referenced records exist and enforce technician roles, ownership, internal-note visibility, and allowed status transitions. MongoDB references do not perform these checks automatically.

Workflow updates spanning multiple documents should use transactions on MongoDB Atlas or a local replica set. Emit Socket.IO events only after commit.

These feature services are not yet implemented by the current skeleton.

Connection reference: [Mongoose connections](https://mongoosejs.com/docs/connections.html).

## ⚡ Planned Real-Time Events

| Event | Trigger | Audience |
| --- | --- | --- |
| `issue:created` | A new issue is stored | Admins |
| `issue:assigned` | A technician is assigned | Reporter, assigned technician, and admins |
| `issue:updated` | Status, priority, or details change | Users authorized to view the issue |
| `comment:added` | A comment is stored | Users authorized to view that comment |
| `notification:new` | A notification is created | The notification recipient |

Internal notes must never be broadcast to ordinary users. Real-time delivery follows the same access rules as the REST API.

## 🔐 Security Requirements

- Hash passwords with bcrypt; never return or log credentials.
- Verify JWTs before processing protected requests.
- Enforce roles and ownership on the server.
- Derive the reporter identity from the authenticated account.
- Reject attempts to self-assign privileged roles.
- Validate write requests and accepted enum values.
- Apply comment visibility rules to API responses and socket events.
- Keep secrets in environment variables and use HTTPS in deployed environments.
- Return predictable, safe errors.

Planned error shape:

```json
{
  "error": "Issue not found",
  "code": "NOT_FOUND"
}
```

## 🧪 Testing and Delivery Plan

The planned validation covers:

- Allowed and rejected status transitions
- Authentication, role checks, and ownership restrictions
- Issue creation, assignment, and database persistence
- Internal-note visibility
- Live updates across separate user sessions
- Responsive reporting and technician workflows

The core demonstration is:

```text
User reports an issue
  → Admin assigns a technician
  → Technician receives a live assignment
  → Technician starts work
  → User receives a status update
  → Technician completes the issue
  → User sees completion and recorded history
```

Deployment is planned for a React frontend host, a Node.js host supporting Socket.IO connections, and MongoDB Atlas. Provider selection and deployment setup remain part of delivery work.

## 👥 Team Ownership

| Member | Primary area | End-to-end ownership |
| --- | --- | --- |
| **MEAD** | Team lead, authentication, and user reporting | GitHub integration, registration/login, route guards, issue creation, and personal issue views |
| **kream** | Admin dashboard and assignment | Filters, technician assignment, statistics, and related API/database work |
| **Mohammad** | Technician workflow and real-time updates | Assigned jobs, status updates, comments, notifications, and Socket.IO |
| **All Team Members** | Quality and integration | PR reviews, testing, conflict resolution, deployment, and presentation |

Features are developed as complete vertical slices: **UI → API → database**, followed by real-time integration where needed.
---

<p align="center">
  <strong>FixFlow</strong> · Report · Assign · Track · Resolve
</p>
