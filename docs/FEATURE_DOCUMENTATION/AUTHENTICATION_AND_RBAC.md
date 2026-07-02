# Feature: Authentication & RBAC (Role-Based Access Control)

## Overview
I implemented **Better Auth** as the security gateway for the system. Authentication is not just about logging in; it protects our billing calculations and menu items from unauthorized staff access, while also logging exactly who performs each critical operational action.

---

## Core Mechanics

### 1. Unified Next.js Layout Protection
Instead of writing session validation boilerplate code inside every dashboard page, I secure routes globally at the layout level in [layout.tsx](file:///D:/Projects/Clients/03_Cue%20Junction%20Cafe/app/%28dashboard%29/layout.tsx):

- The dashboard route group `(dashboard)` shares a common layout.
- When a page load is triggered, `auth.api.getSession()` is called. If no active session exists, the layout immediately intercepts the request and issues a Next.js `redirect("/login")`.
- This ensures that pages under `/tables`, `/sessions`, or `/cafe` are completely inaccessible to unauthenticated users.

### 2. Role-Based Access Control (RBAC)
I defined two distinct roles: `ADMIN` and `STAFF`.
- **`STAFF`:** Restricted to transactional operations. They can start/pause sessions, place cafe orders, register new customers, and collect invoice payments.
- **`ADMIN`:** Full system control. They have access to:
  - Financial reports and analytics graphs (`/reports`).
  - System activity trails (`/logs`).
  - Table configuration management (`/tables/manage`).
  - Cafe menu management (`/cafe/manage/items` and `/cafe/manage/categories`).
  - Staff creation and status updates (`/settings`).

**UI Level Guards:** In `layout.tsx`, navigation items are marked with an `adminOnly: true` flag. If a staff member logs in, the sidebar dynamically filters out these admin-only navigation links.
**Route/Page Guards:** If a staff member tries to manually type the URL of an admin page (e.g. `/settings`), the page component calls `requireAdminPage()`, which immediately redirects them back to the operational dashboard (`/`).

### 3. Server Action Security
Securing the frontend UI is not enough since API requests can be spoofed. I secured all Next.js Server Actions:
- Operational actions (like `startSessionAction` or `placeOrderAction`) call `requireSession()` to verify that the caller is an active, logged-in employee.
- Administrative actions (like `updateSettingsAction` or `createStaffAction`) call `requireAdmin()` to ensure standard staff cannot trigger the backend mutations.
