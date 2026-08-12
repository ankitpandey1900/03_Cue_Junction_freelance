# System Architecture & Component Design Specifications

## 1. Play Session State Machine & Lifecycle
To prevent pricing discrepancies, billing drift, or asset assignment conflicts, table sessions operate on a strict state machine pattern. 

### State Transition Diagram
```
    ┌──────────────┐          Start Session          ┌──────────────┐
    │  AVAILABLE   │ ──────────────────────────────> │    ACTIVE    │
    │   (Table)    │ <────────────────────────────── │  (Session)   │
    └──────────────┘           End & Bill            └──────────────┘
           ▲                                             │      ▲
           │                                 Pause       │      │  Resume
           │                                 Session     │      │  Session
           │                                             ▼      │
           │           End & Bill                    ┌──────────────┐
           └──────────────────────────────────────── │    PAUSED    │
                                                     │  (Session)   │
                                                     └──────────────┘
```

The system manages transition logic via backend transactional controls:

*   **`AVAILABLE` (Table State):** The baseline state for all table assets. No active timer is associated with the table, and bookings can be initialized.
*   **`ACTIVE` (Session State):** Initiated via `startSessionAction`. The associated `Table` status flips to `"OCCUPIED"`. A timer count is run on the frontend relative to the `startTime` timestamp. 
*   **`PAUSED` (Session State):** Transitioned via `pauseSessionAction`. Stops the accumulation of active hours. The `lastPausedAt` timestamp is recorded to track pause durations.
*   **`COMPLETED` (Session State):** Transitioned via `endSessionAction`. The session `endTime` is stamped, the related `Table` is returned to `"AVAILABLE"`, and the final `Invoice` is created.

---

## 2. Pause & Resume Delta Math (Temporal Calculation Engine)
Calculations are executed on the server using UTC dates to prevent errors from timezone configurations. The calculation workflow maps as follows:

```
Session Lifecycle Timeline:
Start (t0)                  Pause (t1)      Resume (t2)             End (t3)
───┼────────────────────────────┼──────────────┼─────────────────────┼───>
   │◄────── Active Play ───────►│◄── Paused ──►│◄─── Active Play ───►│
   │                            │  (Delta t)   │                     │
```

### Formulas
*   **Active Time Elapsed ($\Delta T_{\text{active}}$):**
    $$\Delta T_{\text{active}} = (t_{\text{current}} - t_{\text{start}}) - T_{\text{paused\_accumulated}}$$
*   **Pause Duration Delta ($\Delta t_{\text{pause}}$) during a resume event:**
    $$\Delta t_{\text{pause}} = t_{\text{current}} - t_{\text{last\_paused}}$$
*   **Updating Pause Accumulator ($T_{\text{paused\_accumulated}}$):**
    $$T_{\text{paused\_accumulated}} \leftarrow T_{\text{paused\_accumulated}} + \Delta t_{\text{pause}}$$

### Timer Execution Workflow

#### Phase A: Pausing the Session (`pauseSessionAction`)
1. User clicks "Pause" in the active session card UI.
2. The Server Action verifies that the session is in the `"ACTIVE"` state.
3. The database updates the session record:
    ```sql
    UPDATE "Session"
    SET "status" = 'PAUSED',
        "lastPausedAt" = NOW()
    WHERE "id" = :sessionId;
    ```
4. The client receives the response and stops updating the local elapsed seconds state, setting its value to the delta calculated up to `lastPausedAt`.

#### Phase B: Resuming the Session (`resumeSessionAction`)
1. User clicks "Resume" in the active session card UI.
2. The Server Action retrieves the session record and verifies that `lastPausedAt` is not null.
3. The server computes the pause delta in seconds:
    ```typescript
    const now = new Date();
    const pauseDurationSeconds = Math.floor((now.getTime() - session.lastPausedAt.getTime()) / 1000);
    ```
4. The database is updated:
    ```sql
    UPDATE "Session"
    SET "status" = 'ACTIVE',
        "lastPausedAt" = NULL,
        "totalPauseDurationSeconds" = "totalPauseDurationSeconds" + :pauseDurationSeconds
    WHERE "id" = :sessionId;
    ```
5. Path caches are invalidated, resuming the live counter display on the dashboard card.

---

## 3. Table Switching Architecture
In real-world cafe operations, players often request to move from one table to another (e.g., from a standard Pool table to a VIP Snooker table) midway through their session. The system handles this seamlessly without terminating the session or generating multiple invoices.

### The `switchHistory` Snapshot Pattern
When a table switch occurs:
1. The server calculates the exact time spent and the precise cost incurred on the *current* table up to this exact second.
2. The current accumulated cost is added to the session's `accumulatedCost` field.
3. The exact time spent is added to the session's `accumulatedTimeSeconds` field.
4. A JSON snapshot is pushed to the `switchHistory` array column. This creates a historical ledger of exactly which tables were played on, for how long, and at what rate.
5. The session's `startTime` is reset to `now()`. This ensures the timer running on the new table starts counting purely for the new table's rate.
6. The old table is freed (`AVAILABLE`), and the new table is locked (`OCCUPIED`).

### Final Billing with Switches
When the session is ultimately ended, the `endSessionAction` calculates the cost of the *final* table segment, and adds it to the `accumulatedCost` that was snapshotted during the switches. This guarantees perfect billing precision even if a customer switches between tables with vastly different hourly rates.

---

## 4. Play Pricing Strategy Engine (Prisma Logic Implementation)
Pricing rules are applied by `endSession` inside a database transaction block:

### Configuration Pricing Logic Flowchart
```
                           Check TableType Config
                                     │
                    ┌────────────────┴────────────────┐
          Is fixedRate & fixedDuration set?           │
                    YES                               NO
                     │                                 │
            Total time <= fixedDuration?               │
            ┌───────┴───────┐                          │
           YES              NO                         │
            │               │                          │
      Cost = fixedRate  Cost = fixedRate +             │
                        (Extra Min * Overtime Rate)    │
            │               │                          │
            └───────┬───────┘                          │
                    │                                  ▼
                    │                          Cost = Hours * hourlyRate
                    │                                  │
                    └────────────────┬─────────────────┘
                                     │
                          Is Cost < minimumCharge?
                                ┌────┴────┐
                               YES        NO
                                │         │
                        Cost = minCharge  Cost = Calculated Cost
```

### Source Code Spec: Pricing Calculation Block
```typescript
const endTime = new Date()

// Calculate raw play time in minutes
let totalMinutes = Math.floor((endTime.getTime() - session.startTime.getTime()) / (1000 * 60))

// Offset pause minutes
const pauseMinutes = Math.floor(session.totalPauseDurationSeconds / 60)
totalMinutes = Math.max(1, totalMinutes - pauseMinutes)

const type = session.table.tableType
let cost = 0

if (type.fixedRate != null && type.fixedDuration != null && type.fixedDuration > 0) {
  if (totalMinutes <= type.fixedDuration) {
    cost = type.fixedRate
  } else {
    const extraMinutes = totalMinutes - type.fixedDuration
    const applicableHourlyRate = type.overtimeHourlyRate ?? type.hourlyRate
    cost = type.fixedRate + (extraMinutes / 60) * applicableHourlyRate
  }
} else {
  const hours = totalMinutes / 60
  cost = hours * type.hourlyRate
}

// Enforce minimum charge
if (cost < type.minimumCharge) {
  cost = type.minimumCharge
}
```

---

## 4. Price Snapshotting (Data Integrity Design Pattern)
To ensure historical invoice values remain accurate if menu prices are updated, I use a snapshot pattern.

```
MenuItem Configuration:            Order Mutation Stage:
┌───────────────────────────┐      ┌─────────────────────────────────────────┐
│  id: "item_burger"        │      │ Place Order Trigger                     │
│  name: "Double Cheese"    │ ───> │ - Query Live Price: ₹180                │
│  basePrice: 180.00        │      │ - Decrement MenuItem stock              │
└───────────────────────────┘      └─────────────────────────────────────────┘
                                                       │
                                                       ▼
                                   CustomerOrderItem (Snapshot Target):
                                   ┌─────────────────────────────────────────┐
                                   │  id: "line_item_01"                     │
                                   │  menuItemId: "item_burger"              │
                                   │  itemNameSnapshot: "Double Cheese"      │
                                   │  unitPriceSnapshot: 180.00              │
                                   └─────────────────────────────────────────┘
```

1. **Standalone Catalog Query:** The action queries the database to retrieve item names and prices directly from the `MenuItem` records (preventing client-side payload tampering).
2. **Snapshot Write:** The action copies catalog values directly into `CustomerOrderItem` columns (`unitPriceSnapshot`, `itemNameSnapshot`, `categorySnapshot`).
3. **Calculation Isolation:** Calculations for invoices, orders, and payments reference these snapshots instead of linking dynamically to the base catalog record.

---

## 5. Next.js Caching & Server Data Fetching Strategy
My caching architecture is designed to minimize database roundtrips while ensuring the user interface updates instantly after mutations.

### Route Prefetching & Suspense Skeletons
To keep layout transitions fast and lean, I wrapped each page with a dedicated loading skeleton (`loading.tsx`) using the Next.js Suspense streaming architecture. When a user switches views:
1. The Next.js router transitions immediately, displaying the animated skeleton layout shell matching the target page structure.
2. The Server Component resolves data fetching directly on the database server.
3. React renders the resolved component stream, substituting the skeleton without requiring client-side API requests.

Each major page has its own skeleton tailored to its layout:
- **`/`** — Stats card row + table grid placeholder
- **`/sessions`** — Card grid with action button placeholders
- **`/invoices`** — Table header + row skeletons
- **`/customers`** — Card grid with avatar + stat placeholders
- **`/tables`** — Grid of table cards
- **`/cafe`** — Category tab row + menu item grid
- **`/reports`** — KPI cards + chart placeholders
- **`/logs`** — Table header + row skeletons

### Cache Invalidation (`revalidatePath`)
When changes occur via a Server Action, I bust the Next.js router cache to ensure the client receives fresh server data:
- `startSessionAction` calls `revalidatePath('/sessions')` and `revalidatePath('/tables')`.
- `endSessionAction` calls `revalidatePath('/sessions')`, `revalidatePath('/tables')`, and `revalidatePath('/invoices')`.
- `placeOrderAction` invalidates the active sessions index page to update order badges on the dashboard grid.

### AutoRefresh Polling Strategy
A client-side `AutoRefresh` component calls `router.refresh()` on a timer to pull fresh data from the server. The interval was calibrated at **30 seconds** — fast enough to keep live session states current, slow enough to not saturate the database connection pool with constant round-trips from all open tabs.

---

## 6. Performance Optimization Architecture

### 6.1. Dashboard Query Parallelization
The main dashboard (`/`) previously performed two sequential `Promise.all` groups, adding unnecessary server-side waterfall latency. All six database operations are now issued in a single parallel `Promise.all`:

```typescript
const [tables, activeSessions, upcomingBookingsCount, todayPaymentsAgg, unpaidInvoicesCount, customerCount] = await Promise.all([
  getTables(),
  getActiveSessions(),
  prisma.booking.count({ where: { startTime: { gte: new Date() } } }),
  prisma.payment.aggregate({ where: { paidAt: { gte: todayStart } }, _sum: { amount: true } }),
  prisma.invoice.count({ where: { status: { in: ['UNPAID', 'PARTIAL'] } } }),
  prisma.customer.count({ where: { isArchived: false } }),
])
```

**Key improvement:** Today's collected revenue is computed with `payment.aggregate(_sum)` — a single scalar DB operation — instead of fetching every invoice row and all its payment rows then reducing in JavaScript.

### 6.2. Targeted Field Selection (`select` vs `include`)
`include` fetches every column and all related rows. Queries that only need a subset of fields now use `select`:

| Query | Before | After | Savings |
|---|---|---|---|
| `getInvoices()` | Full invoice + customer + session + table objects | 7 selected fields + 2 nested selects | ~70% less data |
| `getLogs()` | `include: { user }` | `select` of 7 fields + `user.name/email` | Slightly leaner |
| Tables page customer query | Full `Customer[]` via `getCustomers()` | `select` of 8 fields | No unnecessary columns |

### 6.3. Client-Side Timer Optimization
Each `ActiveSessionCard` component had a `setInterval` running every **1 second** to animate the elapsed-time display. With 10 active sessions, this produces 10 timer callbacks per second, causing constant React re-renders and visible UI jank.

Changed to **10-second intervals**. The display granularity is `HH:MM` which doesn't require sub-10-second precision, and the accuracy is still ±10 seconds per session card.

### 6.4. Database Index Strategy
See `DATABASE_DESIGN.md §4` for the full index table. The critical additions were:

- **`Payment(paidAt)`** — Dashboard aggregate query; converted from full-scan to index range scan.
- **`Invoice(createdAt, status, isArchived)`** — Reports date-range filter; was a full scan of all invoices.
- **`ActivityLog(createdAt)`** — Log page ORDER BY; previously a full sequential scan of all audit entries.
- **`CustomerOrder(createdAt, status)`** — Top-selling items report filter; previously a full scan.

