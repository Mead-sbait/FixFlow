# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- People in an organization report maintenance problems and follow their progress.
- Administrators review the full workload, set priorities, assign technicians, and watch for blocked or urgent work.
- Technicians work from an assigned queue, update status, and leave public comments or internal notes.

## Product Purpose

FixFlow gives a small facilities team one place to report, assign, track, and complete maintenance work. The first release succeeds when an issue can move from a user report to an assigned technician and then to completion without leaving the application.

## Positioning

The product is built around a clear, role-based handoff. Each role sees the decisions they are responsible for, while every issue keeps one shared history instead of being scattered across messages, spreadsheets, and verbal updates.

## Operating Context

The main workflow is report, triage, assignment, work in progress, and completion. Administrators need to scan a mixed queue, find urgent work quickly, narrow the list with filters, and assign a technician without losing context. The application must remain usable on phones for reporting and technician updates, while admin issue management can use a denser desktop layout that becomes stacked cards on narrow screens.

## Capabilities and Constraints

- React, TypeScript, React Router, Redux Toolkit, Express, MongoDB with Mongoose, JWT, and Socket.IO.
- One organization and one assigned technician per issue in version 1.
- Issue statuses are `open`, `assigned`, `in_progress`, `completed`, and `cancelled`.
- Priorities are `low`, `medium`, `high`, and `urgent`.
- The database and REST API are the source of truth; Socket.IO announces committed changes.
- Administrators can filter issues, set priority, assign technicians, and view workload statistics.
- MongoDB models are a shared foundation and are not changed as part of the admin dashboard feature.
- Cancellation, reassignment, reopening, and editing after assignment remain team decisions where the design document is not yet final.

## Brand Commitments

The product name is FixFlow. Interface language should be direct, calm, and practical. It should feel suitable for an office, school, apartment building, or small facilities team rather than a consumer lifestyle application.

## Evidence on Hand

The approved design document defines the roles, issue lifecycle, routes, data model, API direction, accessibility expectations, and three-person ownership plan. No production customer data, testimonials, photography, or final brand assets are available, so the interface must not invent them.

## Product Principles

1. Make the next operational decision obvious.
2. Keep status, priority, assignee, and location easy to scan together.
3. Preserve one trustworthy history for every issue.
4. Enforce permissions on the server, not only in the interface.
5. Build complete vertical slices that can be tested and demonstrated.

## Accessibility & Inclusion

The core flows must work at 360px and wider. Status cannot rely on color alone, interactive controls must be keyboard reachable, and errors must be clear and recoverable.
