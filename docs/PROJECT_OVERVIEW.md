# Project Overview: Cue Junction Cafe

## The Elevator Pitch
Cue Junction Cafe isn't your standard cafe—it's a hybrid environment where time is literally money. I needed a robust, low-latency system that handles active table sessions (like Pool tables or PS5 consoles) with live billing while simultaneously operating as a full-fledged food and beverage cafe. 

I built this system from the ground up to solve the core operational bottlenecks of hybrid gaming cafes:
- **Session Drift:** Manually tracking time is a nightmare. My system automatically manages live, pausable table sessions with precision down to the second.
- **Fragmented Billing:** Customers hate getting one bill for gaming and another for food. I unified the billing pipeline so cafe orders seamlessly attach to live table sessions, rolling up into a single, comprehensive invoice at checkout.
- **Auditability:** Staff turnover is a reality. I implemented strict role-based access control (RBAC) and comprehensive audit logging (capturing everything from logins to session pauses) to ensure complete operational transparency.

## Core Domain Breakdown

### 1. Unified Authentication & Access Control
I opted for **Better Auth** over NextAuth for better edge compatibility and native Prisma integration. The system enforces strict separation between `ADMIN` and `STAFF` roles. Staff members are sandboxed to operational tasks (starting sessions, taking orders), while Admins have full CRUD over historical invoices, system settings, and destructive actions. I track exactly when staff log in and log out for payroll and audit purposes.

### 2. Live Session Management
This is the heartbeat of the application. 
- **Pausable Timers:** Sessions aren't just "started" and "ended". I built out a robust state machine (`ACTIVE`, `PAUSED`, `COMPLETED`). When a session is paused, I stamp `lastPausedAt` in Postgres. When resumed, I dynamically calculate the exact delta and aggregate it into `totalPauseDurationSeconds`. This ensures zero billing drift, even if the Node server goes down or the client loses connection.
- **Dynamic Pricing:** Table pricing isn't static. The system calculates complex matrices on the fly (e.g., minimum charges, fixed upfront packages that automatically roll over into overtime hourly rates).
- **Seamless Table Switching:** Players can move from one table to another (e.g., standard to VIP) mid-game. The system snapshots the exact cost and time incurred on the old table and instantly starts a fresh timer at the new table's rate, rolling it all into one precise bill at the end.

### 3. Global Settings & Configurations
The entire application behavior can be controlled from a central `CafeSettings` singleton. Admins can toggle accepted payment methods (UPI/Card/Cash), set global tax rates, and customize receipt footers without touching the codebase or deploying updates.

### 4. The Cafe Module (Formerly POS)
I recently refactored and rebranded the legacy "POS" module into a unified "Cafe" module. It supports both standalone walk-in orders and attached session orders. 
- **Inventory Locking:** When an order is placed, I immediately decrement the `stock` counter in a Prisma transaction to prevent race conditions during busy hours.
- **Snapshot Pricing:** I snapshot the `unitPrice` and `itemName` directly into the `CustomerOrderItem` table at the time of purchase. If an admin changes a burger's price tomorrow, yesterday's invoices remain mathematically intact.

### 5. Consolidated Billing & Invoicing
When a session ends, the system aggregates the time-based cost of the table and all attached cafe orders into a single `Invoice`. 
- **Transactions:** I wrap the entire session termination flow (calculating time, freeing the table, aggregating cafe totals, generating the invoice, marking orders as served) in a single massive Prisma `$transaction` to guarantee database consistency.

### 6. Performance & DX
I're leaning heavily into Next.js App Router capabilities. I've wrapped the dashboard in React `Suspense` boundaries (`loading.tsx`). This means when a staff member navigates between heavy data views, the layout resolves instantly with a sleek skeleton, offloading the heavy DB queries to the background. It feels like a high-performance SPA, but with the SEO and data-fetching benefits of SSR.
