# ADR 0001: Architecture Stack

**Status:** Accepted
**Date:** June 2026

## Context and Problem Statement
I needed to build a unified management system for a hybrid game zone and cafe. The system required complex state management (live session timers, active food orders) and highly reliable financial transactions. The client required it to be web-based, accessible on iPads, desktops, and phones.

## Considered Options
1. **MERN Stack (React + Express + MongoDB)**
2. **Next.js (App Router) + Prisma + PostgreSQL**
3. **React SPA + Firebase**

## Decision Outcome
**Chosen option: Next.js + Prisma + PostgreSQL**

I went with the Next.js App Router. Why?
- **Server Actions:** I eliminated the need to write and maintain a separate Express REST API. The mental overhead of typing a payload in the backend and manually casting it in the frontend is gone. 
- **Type Safety:** Prisma tied to Postgres gives me end-to-end type safety. If I change a column in the database, the TypeScript compiler instantly flags every component that breaks.
- **Relational Data:** I immediately discarded MongoDB/Firebase. I are dealing with Invoices, Orders, and Sessions. Trying to handle complex, ACID-compliant financial joins in a NoSQL document store is a nightmare waiting to happen. Postgres was the only sensible choice.
- **Better Auth:** Replaced standard NextAuth/Auth.js with Better Auth to provide a cleaner, more edge-compatible authentication layer that integrates natively with Prisma and Server Actions without the headache of middleware conflicts.

## Consequences
- **Positive:** Developer velocity is extremely high. The Feature-Sliced Design inside the `features/` directory keeps the codebase pristine. 
- **Negative:** Next.js Server Components introduce a steep learning curve regarding what runs on the server vs the client. The caching layer (Router Cache, Data Cache) occasionally requires aggressive `revalidatePath` calls to ensure the UI updates immediately after a mutation.
