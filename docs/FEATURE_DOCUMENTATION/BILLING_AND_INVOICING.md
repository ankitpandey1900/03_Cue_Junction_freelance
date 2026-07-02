# Feature: Unified Billing & Invoicing

## Overview
I designed the **Billing & Invoicing** system to solve the problem of fragmented cafe bills. Instead of tracking gaming sessions and cafe snacks on separate receipts, I consolidated the two domains. When a session ends, all active time costs and associated cafe tab orders are automatically rolled up into a single, cohesive invoice.

---

## Core Mechanics

### 1. The Checkout Transaction Flow
When checking out a table, the system must perform multiple critical database updates. To prevent race conditions or partial failures (e.g. freeing a table but failing to save the invoice), I wrapped the entire checkout sequence in a single Prisma database transaction (`$transaction`):

1. **Calculate Game Cost:** I run the active session time through the cost calculator (taking care of minimum charges and overtime packages).
2. **Compile Cafe Orders:** I gather all `CustomerOrder` records linked to this session, sum their totals, and update the orders to `SERVED`.
3. **Generate Invoice:** I create an `Invoice` containing:
   - `sessionTotal` (the cost of the game time).
   - `cafeTotal` (the cost of all food and beverages).
   - `grandTotal` (the sum of both, minus any discounts plus taxes).
4. **Link Orders:** I link all the orders directly to the newly created invoice.
5. **Free the Table:** I set the table status back to `AVAILABLE`.
6. **Mark Session Completed:** I set the session status to `COMPLETED`.

### 2. Standalone Invoices (Walk-ins)
If a customer only visits the cafe without booking a pool table, they place a "Walk-in" order. 
- In this case, `placeOrderAction` creates a `CustomerOrder` without a `sessionId`.
- At checkout, a staff member can generate a direct invoice linked only to the cafe orders. The `sessionTotal` on this invoice remains `₹0`.

### 3. Payment Processing
Invoices are generated with an initial status of `UNPAID`. When a customer pays, a staff member records the payment:
- **Supported Methods:** `CASH`, `CARD`, `UPI`, or `MIXED` (split payments).
- **Audit Logging:** Every payment maps back to the specific staff member who collected the cash/registered the transaction (`receivedById`), ensuring strict accounting reconciliation at the end of the shift.
