# ADR 0002: Database & Auth Strategy

**Status:** Accepted
**Date:** June 2026

## Context and Problem Statement
I needed an authentication provider that supported role-based access control (RBAC), didn't lock me into an expensive SaaS tier, and integrated natively with my Prisma schema so I could query user data alongside my business logic.

## Considered Options
1. **NextAuth.js (Auth.js)**
2. **Supabase Auth**
3. **Better Auth**
4. **Clerk**

## Decision Outcome
**Chosen option: Better Auth**

I started evaluating NextAuth, but its edge compatibility and session management API felt clunky for my specific needs. Clerk is incredible, but it abstracts the user data into their own database, which makes joining a `User` to an `ActivityLog` a multi-step networking headache. 

I selected **Better Auth** because it is lightweight, extremely modern, and injects its tables (`user`, `session`, `account`) directly into my Prisma schema. I have full control over the database. 

## Schema Isolation Decision
A critical decision I made was keeping the Auth schema strictly isolated from the Business schema.
- `User` strictly represents staff/admins who log into the dashboard.
- `Customer` strictly represents the people playing pool and buying food.
This explicitly prevents a scenario where a customer accidentally gets a dashboard session token. I also added `lastLoginAt` and `lastLogoutAt` directly via Better Auth's database hooks for strict staff auditing.
