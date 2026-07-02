# Feature: Cafe Module (Formerly POS)

## Overview
I recently ripped out all the legacy "POS" naming conventions because it didn't accurately reflect what the module does. It's not just a standalone Point of Sale; it is deeply integrated into the active gaming sessions. I renamed it to the **Cafe Module**.

The Cafe Module handles menu categories, individual inventory items, and order processing for both walk-in customers and active table sessions.

## Core Mechanics

### 1. The Menu Hierarchy
I structured the menu using two models: `MenuCategory` and `MenuItem`.
- Categories (e.g., "Hot Beverages", "Snacks") dictate the high-level grouping.
- Items belong to a single category.

**Soft Deletes:** If an admin removes a Category or Item, I do not issue a SQL `DELETE`. I toggle `isActive` or `isAvailable` to `false`. Why? Because if I hard deleted a burger, Prisma's foreign key constraints would either throw an error or cascade and delete every single historical order containing that burger. Soft deletes keep the accounting math pristine.

### 2. Processing an Order
The core logic lives in `placeOrderAction` in `features/cafe/actions/cafe.actions.ts`.

When a staff member submits a cafe order:
1. I run the input through a Zod schema to ensure quantities are valid positive integers.
2. I query the DB for the current, live prices of the requested items (I NEVER trust the price sent from the client/browser to prevent tampering).
3. **Transaction Start:**
   - I verify `stock >= quantity`.
   - I decrement the `stock` counter.
   - I generate the `CustomerOrder` record.
   - I map over the items and create `CustomerOrderItem` rows. **Crucially, I snapshot the `unitPrice` and `itemName` directly into this row.**
4. If a `sessionId` was provided in the payload, the order is attached to that live table session and the status is set to `PENDING` (sent to kitchen). It will be paid for when the session ends.
5. If no `sessionId` was provided, it's a walk-in order. (Note: Standalone checkout UI for walk-ins is currently on the roadmap).

### 3. Kitchen Status Updates
Staff can toggle cafe item statuses from the `ActiveSessionCard` (e.g., flipping a burger from `PENDING` to `SERVED`). This triggers `updateOrderStatusAction`, which immediately revalidates the cache so the dashboard UI updates in real-time across all active clients.
