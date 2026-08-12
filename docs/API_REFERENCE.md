# Internal API & Server Actions Technical Manual

## 1. Architectural Philosophy of Server Actions
In this application, I bypassed standard REST/GraphQL endpoints entirely. Next.js 15 Server Actions act as the RPC (Remote Procedure Call) bridge between client-side user interactions and the database layer. This architecture provides several distinct advantages:
- **Zero Network Layer Overhead:** I do not compile, parse, or route JSON endpoints via HTTP routers. Next.js handles client-server serialization under the hood.
- **Unified Types:** The client component calls actions directly as regular async JavaScript functions. If the database schema changes, TypeScript compiler instantly fails the build if the parameters mismatch.
- **Secured Execution Environment:** Server Actions compile exclusively to server-side code. They run in a secure context, allowing me to interact with the database directly using my Prisma client without exposing query patterns or keys to the client bundles.

---

## 2. Global Request/Response Specification
Every action must return a consistent, structured object format defined by the generic type `ActionResponse<T>`. I **never** throw raw errors up to the UI layer; throwing uncaught errors on the server leads to generic, unhelpful Next.js runtime errors in production. Instead, errors are caught, serialized, and returned as values.

```typescript
export type ActionResponse<T = unknown> = {
  success: boolean                    // True if operation succeeded, false otherwise.
  message: string                     // Developer-friendly or user-facing feedback message.
  data?: T                            // Dynamic payload returned on success.
  errors?: Record<string, string[]>  // Key-value map of Zod field-specific validation errors.
}
```

### Generic Server Action Middleware Pattern
Every server action follows a strict 5-stage pipeline:
1. **Authentication Check:** Validate the current session using `requireSession()`.
2. **Access Control Check:** Validate the role permissions (e.g., restricting invoice voids to `ADMIN`).
3. **Data Schema Validation:** Parse the incoming payload using a Zod schema via `safeParse()`.
4. **Service Layer Execution:** Delegate to the service function which houses the transaction logic.
5. **Cache Busting:** Trigger Next.js cache invalidation using `revalidatePath()`.

---

## 3. Session Domain Actions (`features/sessions/actions/session.actions.ts`)

### 3.1. `startSessionAction`
Initializes a live play session on a specific table for a customer.

- **Zod Schema (`startSessionSchema`):**
  ```typescript
  export const startSessionSchema = zod.object({
    tableId: zod.string().cuid({ message: "Invalid table identifier" }),
    customerId: zod.string().cuid().optional().nullable(),
  })
  ```
- **Step-by-Step Logic Flow:**
  1. Calls `requireSession()` to verify that the active user is a logged-in staff member.
  2. Parses raw input arguments against `startSessionSchema`. If validation fails, returns `success: false` with validation fields mapped in `errors`.
  3. Executes a transactional database change:
     - Fetches target table and verifies its status is `"AVAILABLE"`. If occupied or in maintenance, aborts and throws error.
     - Updates the table status to `"OCCUPIED"`.
     - Creates the `Session` record with status set to `"ACTIVE"`.
  4. Calls `logActivity()` to log `"SESSION_STARTED"`.
  5. Invalidates `/sessions` and `/tables` paths using `revalidatePath()`.
- **Response Format on Success:**
  ```json
  {
    "success": true,
    "message": "Session started successfully",
    "data": {
      "id": "cm1234567890",
      "tableId": "table9876",
      "customerId": null,
      "startTime": "2026-07-02T10:45:00.000Z",
      "status": "ACTIVE"
    }
  }
  ```

---

### 3.2. `pauseSessionAction`
Freezes the billing timer for an active session to stop the accumulation of hourly charges.

- **Parameters:** `sessionId: string` (Must be a valid, existing session ID).
- **Step-by-Step Logic Flow:**
  1. Validates the operator session.
  2. Queries the database for the active session. If session status is not `"ACTIVE"`, it aborts (only active sessions can be paused).
  3. Sets `status` to `"PAUSED"`.
  4. Stores the exact current time in `lastPausedAt`.
  5. Logs the activity as `"SESSION_PAUSED"`.
  6. Revalidates paths `/sessions` and `/tables`.
- **Response Format on Success:**
  ```json
  {
    "success": true,
    "message": "Session paused successfully",
    "data": {
      "id": "cm1234567890",
      "status": "PAUSED",
      "lastPausedAt": "2026-07-02T11:15:00.000Z"
    }
  }
  ```

---

### 3.3. `resumeSessionAction`
Unfreezes the billing timer and updates the accumulated pause duration offset.

- **Parameters:** `sessionId: string`.
- **Step-by-Step Logic Flow:**
  1. Validates authentication.
  2. Queries the session and checks if it is indeed `"PAUSED"` and has a valid `lastPausedAt` stamp.
  3. Computes the duration delta:
     $$\Delta t_{\text{seconds}} = \text{now}() - \text{lastPausedAt}$$
  4. Updates the database:
     - Sets `status` to `"ACTIVE"`.
     - Increments `totalPauseDurationSeconds` by adding $\Delta t_{\text{seconds}}$.
     - Clears the `lastPausedAt` field back to `null`.
  5. Logs the activity as `"SESSION_RESUMED"`.
  6. Triggers revalidation paths.

---

### 3.4. `switchTableAction`
Transfers an active session from one physical table to another, snapshotting the accumulated cost and time on the old table.

- **Parameters:** `sessionId: string`, `newTableId: string`.
- **Step-by-Step Logic Flow:**
  1. Validates operator session.
  2. Queries the current session and the new target table.
  3. Ensures the new table is `AVAILABLE`.
  4. Computes the cost accumulated on the current table up to this exact second.
  5. Updates the database:
     - Sets the old table's status to `AVAILABLE`.
     - Sets the new table's status to `OCCUPIED`.
     - Appends a snapshot entry to the session's `switchHistory` JSON array (recording the old table's rate, duration spent on it, and cost incurred).
     - Updates the session's `tableId` to the `newTableId`.
     - Updates `accumulatedTimeSeconds` and `accumulatedCost` with the computed values.
     - Resets the session's timer baseline so it counts from 0 on the new table.
  6. Revalidates paths `/sessions` and `/tables`.

---

### 3.5. `endSessionAction`
Calculates final charges, completes the session, frees the table, and generates the invoice.

- **Parameters:** `sessionId: string`.
- **Calculations Logic:**
  1. Computes total elapsed play time:
     $$\text{Total Time} = \text{now}() - \text{startTime} - \text{totalPauseDurationSeconds}$$
  2. Converts total play time to minutes.
  3. Applies pricing rules from `TableType`:
     - If flat-rate package is configured: charges `fixedRate` up to `fixedDuration` minutes, then applies `overtimeHourlyRate` on extra minutes.
     - Else: applies standard `hourlyRate` linearly.
     - Applies `minimumCharge` constraint if the final calculated rate falls below the floor price.
- **Prisma Transaction Operations:**
  - Updates `Session` status to `"COMPLETED"`.
  - Reverts `Table` status back to `"AVAILABLE"`.
  - Aggregates all linked `CustomerOrder` lines that are not `"CANCELLED"`.
  - Generates the final, immutable `Invoice` combining table time cost + total cafe orders cost.
  - Automatically updates any remaining pending cafe orders to `"SERVED"`.
- **Response Format on Success:**
  ```json
  {
    "success": true,
    "message": "Session ended. Total Cost: ₹450",
    "data": {
      "session": { "id": "cm1234567890", "status": "COMPLETED" },
      "totalCost": 450.00,
      "invoiceId": "inv55443322"
    }
  }
  ```

---

## 4. Cafe Domain Actions (`features/cafe/actions/cafe.actions.ts`)

### 4.1. `placeOrderAction`
Registers food and drink orders. Supports direct table sessions or standalone walk-ins.

- **Zod Schema (`placeOrderSchema`):**
  ```typescript
  export const placeOrderSchema = zod.object({
    sessionId: zod.string().cuid().optional().nullable(),
    customerId: zod.string().cuid().optional().nullable(),
    items: zod.array(zod.object({
      itemId: zod.string().cuid(),
      quantity: zod.number().int().positive({ message: "Quantity must be at least 1" })
    })),
    notes: zod.string().max(300).optional()
  })
  ```
- **Step-by-Step Logic Flow:**
  1. Ensures caller is authenticated.
  2. Parses inputs with `placeOrderSchema`.
  3. Runs inside a database transactional block:
     - For each item in the payload:
       - Queries the live price and stock from the `MenuItem` table (preventing price injection hacks).
       - Checks if `stock >= quantity`. If inventory is depleted, immediately aborts the entire transaction.
       - Decrements the `MenuItem` stock count by the ordered `quantity`.
     - Creates the `CustomerOrder` record.
     - Creates the `CustomerOrderItem` lines using snapshot fields: `itemNameSnapshot`, `categorySnapshot`, `unitPriceSnapshot`.
- **Cache Invalidation:** Calls `revalidatePath('/sessions')` to trigger visual state updates on dashboard active session cards.

---

## 5. Billing Domain Actions (`features/billing/actions/invoice.actions.ts`)

### 5.1. `recordPaymentAction`
Applies a payment method (Cash, UPI, Card) to settle an invoice.

- **Zod Schema:**
  ```typescript
  export const recordPaymentSchema = zod.object({
    invoiceId: zod.string().cuid(),
    amount: zod.number().positive(),
    method: zod.enum(["CASH", "CARD", "UPI"])
  })
  ```
- **Execution flow:**
  1. Reads invoice total.
  2. Creates the `Payment` record linked to the invoice.
  3. Sums up all payments made for this invoice. 
  4. If `Total Payments >= Invoice Grand Total`, flips `Invoice` status to `"PAID"`.
  5. Invalidates `/invoices`.

### 5.2. `deleteInvoiceAction` (Destructive Admin-Only)
Removes an incorrectly generated invoice from the logs.

- **Parameters:** `invoiceId: string`.
- **Validation:**
  - Checks if operator role is `"ADMIN"`. If role is `"STAFF"`, it returns a prompt error `success: false, message: "Unauthorized. Admin privileges required."`.
- **Action:** Cascades down, deletes linked payment histories, and removes the invoice. Revalidates `/invoices` and `/sessions`.
