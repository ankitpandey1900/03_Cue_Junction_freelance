# Database Design Strategy & Schema Specification

## 1. Architectural Philosophy
My database design prioritizes **strict relational integrity, financial auditability, and clear separation of concerns**. In a hybrid business model where time tracking (gaming/tables) interfaces directly with inventory sales (cafe orders), a naive schema will inevitably result in invoice drift, race conditions on stock, or security leaks. 

I selected **PostgreSQL** hosted on Supabase to serve as the core transactional engine. PostgreSQL provides the robust ACID compliance required to guarantee that financial mutations (such as checking out a table, decrementing food stock, and issuing an invoice) either succeed entirely or roll back cleanly without leaving orphaned records. 

To interface with PostgreSQL, I utilize **Prisma ORM**. Prisma acts as my single source of truth for schema definitions, automates migration scripts, and generates a type-safe client that prevents runtime queries from executing on stale or non-existent columns.

---

## 2. Separation of Concerns (Auth vs. Business Domains)
A core security principle implemented in this database is the **strict boundary between Authentication and Business entities**. 

```
┌──────────────────────────────────────┐          ┌──────────────────────────────────────┐
│             AUTH DOMAIN              │          │           BUSINESS DOMAIN            │
│  - User (Staff/Admin Accounts)       │          │  - Customer (Patrons/Players)        │
│  - AuthSession                       │          │  - Session (Time billing logs)       │
│  - Account (Credentials/OAuth)       │          │  - Invoice (Financial records)       │
└──────────────────────────────────────┘          └──────────────────────────────────────┘
                   │                                                  │
                   └───────────────── Linked Via ─────────────────────┘
                                     ActivityLog
```

- **Authentication Domain (`User`, `Account`, `AuthSession`):** These tables are controlled and populated by **Better Auth**. They represent *employees* (Admins and Staff) who log into the dashboard to execute operations.
- **Business Domain (`Customer`, `Session`, `Invoice`):** These tables represent *customers* who visit the cafe, play games, and buy food. 

A `Customer` cannot log into the dashboard, and a dashboard `User` (Staff) does not have a customer loyalty record. This isolation ensures that even if a staff member's credentials are compromised, or a customer attempts to query the database, they cannot bypass access controls because there are no shared tables or weak relational mappings between authentication credentials and customer records. The only bridge is the `ActivityLog` table, which references a `User`'s ID when logging who initiated an action on a business entity.

---

## 3. Comprehensive Model Definitions & Fields

### 3.1. Authentication Models

#### Model: `User`
Stores details of the staff and administrators who operate the system.
- `id` (String, Primary Key, CUID): Unique identifier.
- `email` (String, Unique): User's login email.
- `name` (String, Optional): The display name of the staff member.
- `emailVerified` (Boolean, Default: `false`): Verification status flag.
- `image` (String, Optional): Avatar URL.
- `role` (String, Default: `"STAFF"`): Determines system access level. Restricts access to settings and historical logs. Options: `"ADMIN" | "STAFF"`.
- `status` (String, Default: `"ACTIVE"`): Flag to suspend a user account. Options: `"ACTIVE" | "INACTIVE"`.
- `lastLoginAt` (DateTime, Optional): Updated via Better Auth hooks upon successful login.
- `lastLogoutAt` (DateTime, Optional): Updated via Better Auth hooks upon session termination.
- `createdAt` (DateTime, Default: `now()`): Creation timestamp.
- `updatedAt` (DateTime, Auto-updated): Last modification timestamp.

#### Model: `Account`
Manages credentials and authentication provider links.
- `id` (String, Primary Key, CUID).
- `accountId` (String): Provider-specific account identifier.
- `providerId` (String): The provider protocol (e.g., `"credential"`).
- `userId` (String, Foreign Key -> `User.id`, Cascade Delete).
- `accessToken` / `refreshToken` / `idToken` (String, Optional): Token storage.
- `accessTokenExpiresAt` / `refreshTokenExpiresAt` (DateTime, Optional).
- `scope` (String, Optional).
- `password` (String, Optional): Hashed password for email/password authentication.

#### Model: `AuthSession`
Tracks active logins.
- `id` (String, Primary Key, CUID).
- `expiresAt` (DateTime): Token expiration time.
- `token` (String, Unique): Active session token.
- `ipAddress` / `userAgent` (String, Optional): Auditing metadata.
- `userId` (String, Foreign Key -> `User.id`, Cascade Delete).

---

### 3.2. Customer Domain

#### Model: `Customer`
Stores CRM data for patrons to track spend and manage loyalty.
- `id` (String, Primary Key, CUID).
- `name` (String): Customer's name.
- `phone` (String, Unique): Customer's primary contact number. Used for quick searches at check-in.
- `email` (String, Optional): Customer's email.
- `totalSpend` (Float, Default: `0`): Aggregated sum of all paid invoices. Used to calculate customer value.
- `loyaltyPoints` (Int, Default: `0`): Running total of loyalty points available for redemption.
- `isArchived` (Boolean, Default: `false`): **Soft delete flag.** Setting this to `true` removes the customer from all list views, search results, and new session dialogs while preserving all historical invoices, loyalty history, and spending data in the database for financial audit integrity.

---

### 3.3. Asset Management (Tables & Play Areas)

#### Model: `TableType`
Defines categories of assets (e.g., "Standard Pool Table", "VIP PS5 Lounge") and houses the complex pricing matrices.
- `id` (String, Primary Key, CUID).
- `name` (String): Display name.
- `hourlyRate` (Float): Base rate charged per hour of active session.
- `minimumCharge` (Float, Default: `0`): Minimum floor price for starting a session on this asset type.
- `fixedRate` (Float, Optional): Flat rate for a fixed initial package.
- `fixedDuration` (Int, Optional): Duration of the flat-rate package in minutes.
- `overtimeHourlyRate` (Float, Optional): The rate applied per hour *after* the `fixedDuration` is exceeded. Defaults to the base `hourlyRate` if not specified.
- `isArchived` (Boolean, Default: `false`): Soft delete flag. Prevents displaying this type for new assets while preserving history.

#### Model: `Table`
Represents physical assets present in the cafe.
- `id` (String, Primary Key, CUID).
- `tableTypeId` (String, Foreign Key -> `TableType.id`): Links to the pricing model.
- `name` (String): Unique name (e.g., "Pool Table 1", "PS5 Console B").
- `status` (String, Default: `"AVAILABLE"`): Current operational state. Options: `"AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE"`.
- `isArchived` (Boolean, Default: `false`): Soft delete flag.

---

### 3.4. Bookings & Temporal Sessions

#### Model: `Booking`
Manages future reservations.
- `id` (String, Primary Key, CUID).
- `customerId` (String, Foreign Key -> `Customer.id`).
- `tableId` (String, Foreign Key -> `Table.id`).
- `startTime` (DateTime): Slotted start time.
- `endTime` (DateTime): Slotted end time.
- `status` (String, Default: `"PENDING"`): State of reservation. Options: `"PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"`.

#### Model: `Session`
Represents an active, pausable temporal session on a physical table.
- `id` (String, Primary Key, CUID).
- `customerId` (String, Optional, Foreign Key -> `Customer.id`): Linked customer (or null if walk-in guest).
- `tableId` (String, Foreign Key -> `Table.id`).
- `bookingId` (String, Unique, Optional, Foreign Key -> `Booking.id`).
- `invoiceId` (String, Optional, Foreign Key -> `Invoice.id`): Linked to the invoice once checked out.
- `type` (String, Default: `"POSTPAID"`): Billing trigger mode. Options: `"PREPAID" | "POSTPAID"`.
- `startTime` (DateTime, Default: `now()`): When the session was started.
- `endTime` (DateTime, Optional): When the session ended.
- `totalPauseDurationSeconds` (Int, Default: `0`): Total accumulated pause duration, calculated and stored dynamically.
- `extraCharges` (Float, Default: `0`): Additional flat charges levied on the session.
- `lastPausedAt` (DateTime, Optional): The exact timestamp when the session was last paused. Used to compute pause delta on resume.
- `status` (String, Default: `"ACTIVE"`): Current temporal state. Options: `"ACTIVE" | "PAUSED" | "COMPLETED"`.

---

### 3.5. Cafe / Inventory Domain

#### Model: `MenuCategory`
High-level organization for cafe items.
- `id` (String, Primary Key, CUID).
- `name` (String): Display name (e.g., "Mocktails", "Burgers").
- `slug` (String, Unique): URL-friendly string.
- `description` (String, Optional).
- `displayOrder` (Int, Default: `0`): Sorting weight for frontend rendering.
- `isActive` (Boolean, Default: `true`): Soft delete toggle.

#### Model: `MenuItem`
Represent individual items available for purchase.
- `id` (String, Primary Key, CUID).
- `categoryId` (String, Foreign Key -> `MenuCategory.id`).
- `sku` (String, Unique): Stock Keeping Unit for barcode/inventory scan compliance.
- `name` (String): Item name.
- `slug` (String, Unique).
- `description` (String, Optional).
- `basePrice` (Float): Default selling price.
- `imageUrl` (String, Optional).
- `preparationTime` (Int, Default: `10`): Estimated prep time in minutes.
- `displayOrder` (Int, Default: `0`).
- `isAvailable` (Boolean, Default: `true`): Soft delete toggle.
- `stock` (Int, Default: `0`): Current physical count in inventory.

---

### 3.6. Transactions & Billing

#### Model: `CustomerOrder`
Represents a group of cafe items ordered by a table or walk-in.
- `id` (String, Primary Key, CUID).
- `customerId` (String, Optional, Foreign Key -> `Customer.id`).
- `sessionId` (String, Optional, Foreign Key -> `Session.id`): If populated, this order is billed directly to the table session at checkout.
- `invoiceId` (String, Optional, Foreign Key -> `Invoice.id`): If populated, this order is linked to the generated invoice.
- `status` (String, Default: `"PENDING"`): State of order. Options: `"PENDING" | "PREPARING" | "READY" | "SERVED" | "CANCELLED"`.
- `subtotal` (Float, Default: `0`).
- `discount` (Float, Default: `0`).
- `tax` (Float, Default: `0`).
- `total` (Float, Default: `0`).
- `notes` (String, Optional): Cooking/staff instructions.
- `createdBy` (String, Optional): The ID of the staff member who rang up the order.

#### Model: `CustomerOrderItem`
The detailed lines of an order. Handles price snapshotting.
- `id` (String, Primary Key, CUID).
- `orderId` (String, Foreign Key -> `CustomerOrder.id`, Cascade Delete).
- `menuItemId` (String, Foreign Key -> `MenuItem.id`): Retained purely for historical purchase reports.
- `itemNameSnapshot` (String): Immutable copy of `MenuItem.name` at transaction time.
- `categorySnapshot` (String): Immutable copy of `MenuCategory.name` at transaction time.
- `unitPriceSnapshot` (Float): Immutable copy of `MenuItem.basePrice` at transaction time.
- `quantity` (Int): Count of items ordered.
- `totalPrice` (Float): Calculated as `unitPriceSnapshot * quantity`.

#### Model: `Invoice`
Final financial document capturing total revenue for a billing event.
- `id` (String, Primary Key, CUID).
- `invoiceNumber` (Int, Unique, Autoincrement): Human-readable serial invoice number.
- `customerId` (String, Optional, Foreign Key -> `Customer.id`).
- `sessionTotal` (Float, Default: `0`): Mathematical total computed from table time across all linked sessions.
- `cafeTotal` (Float, Default: `0`): Aggregated total of all linked `CustomerOrder` rows.
- `taxAmount` (Float, Default: `0`): Applicable tax computed based on cafe settings.
- `discountAmount` (Float, Default: `0`): Applied discount to the final bill.
- `grandTotal` (Float): Final payable amount. Calculated as `(sessionTotal + cafeTotal) - discountAmount + taxAmount`.
- `status` (String, Default: `"UNPAID"`): Options: `"UNPAID" | "PARTIAL" | "PAID" | "REFUNDED" | "CANCELLED"`.
- `paymentMethod` (String, Optional, Default: `"CASH"`): Options: `"CASH" | "CARD" | "UPI" | "MIXED"`.
- `dueDate` (DateTime, Optional): Used for deferred billing.
- `notes` (String, Optional): Staff-entered comments or void reasons.
- `createdAt` (DateTime, Default: `now()`).
- `isArchived` (Boolean, Default: `false`): **Soft delete flag.** Setting this to `true` removes the invoice from all list views, reports, and customer profiles while preserving the underlying financial record. Hard deletes are never performed on invoices to maintain accounting integrity and complete audit trails.

#### Model: `Payment`
Tracks physical money intake.
- `id` (String, Primary Key, CUID).
- `invoiceId` (String, Foreign Key -> `Invoice.id`, Cascade Delete).
- `amount` (Float): Amount paid in this transaction.
- `method` (String): Options: `"CASH" | "CARD" | "UPI"`.
- `paidAt` (DateTime, Default: `now()`).

---

### 3.7. System Audit & Configuration

#### Model: `ActivityLog`
Implements the security logging requirements.
- `id` (String, Primary Key, CUID).
- `userId` (String, Foreign Key -> `User.id`): Identifies which employee performed the action.
- `action` (String): Action identifier (e.g. `"SESSION_STARTED"`, `"SESSION_PAUSED"`, `"INVOICE_VOIDED"`).
- `entityType` (String): Target table (e.g. `"SESSION"`, `"INVOICE"`).
- `entityId` (String): The UUID of the target record.
- `metadata` (String, Optional): JSON-formatted string storing context (e.g., `{"tableName": "Pool Table 1"}`).
- `createdAt` (DateTime, Default: `now()`).

#### Model: `CafeSettings`
A single-row configuration table holding system defaults.
- `id` (String, Primary Key, CUID).
- `cafeName` (String, Default: `"Cue Junction Cafe"`).
- `defaultHourlyRate` (Float, Default: `200`).
- `receiptFooterText` (String, Default: `"Thank you for visiting!"`).
- `logoUrl` (String, Optional).
- `currency` (String, Default: `"INR"`).
- `taxRate` (Float, Default: `0`).
- `gstin` (String, Optional).
- `acceptUpi` / `acceptCard` / `acceptCash` (Boolean, Default: `true`).

---

## 4. Key Performance Indexes (Indexes Strategy)
To ensure the dashboard operates with low latency, I have explicitly indexed fields that are heavily queried:

### 4.1. Structural & Lookup Indexes
- **`Session` Table:** Index on `[status]` — critical for fetching active sessions instantly on dashboard loads without a full-table scan.
- **`Table` Table:** Index on `[status]` — accelerates loading the physical grid showing available tables.
- **`MenuItem` Table:** Indexes on `[name]`, `[slug]`, `[categoryId]`, and `[isAvailable]` — ensures searching for food items, loading menu categories, and checking availability executes in under 5ms.

### 4.2. Financial Query Indexes (Added in Performance Optimization)
These indexes were added specifically to accelerate the date-range report queries and billing lookups that previously required full table scans:

- **`Invoice` Table:** Indexes on `[createdAt]`, `[status]`, `[isArchived]`, and `[customerId]` — used by the reports dashboard when filtering invoices by date range, status, and customer. Prevents full-scan on every report load.
- **`Payment` Table:** Indexes on `[paidAt]` and `[invoiceId]` — used by the `payment.aggregate(_sum)` query on the main dashboard to compute today's collected revenue, and by the reports revenue chart.
- **`ActivityLog` Table:** Indexes on `[createdAt]`, `[userId]`, and `[entityType]` — the logs page fetches the 200 most recent records ordered by date. Without a `createdAt` index, PostgreSQL performs a full sequential scan of the entire log table on every page load.
- **`CustomerOrder` Table:** Indexes on `[createdAt]`, `[status]`, and `[sessionId]` — used by the top-selling items report which filters orders by date range and status.

### 4.3. Unique Constraints
Enforced at the database engine level to prevent data duplication:
- `Customer(phone)`, `TableType(name)`, `Table(name)`, `MenuCategory(slug)`, `MenuItem(sku, slug)`, `Invoice(invoiceNumber)`

---

## 5. Soft Delete Strategy

A deliberate architectural decision has been made to **never hard-delete Customers or Invoices** from the database.

### Why Soft Deletes?
- **Financial Audit Integrity:** Deleting an invoice row would create gaps in the sequential `invoiceNumber` series and would corrupt historical revenue reports. A business must be able to reconstruct any financial period accurately.
- **Spend History Preservation:** Deleting a customer would orphan all their historical invoices and make it impossible to audit lifetime spend or refund payments.
- **Regulatory Safety:** Any future tax audit or financial review requires complete transaction history.

### Implementation
- Both `Customer` and `Invoice` models have an `isArchived Boolean @default(false)` column.
- All `findMany`, `findFirst`, and `findUnique` queries in the service layer filter by `isArchived: false`.
- The "Delete" action in the UI calls a server action that sets `isArchived: true` — the row stays in the database forever but becomes invisible to the application.
- The `isArchived` field is indexed on both models to ensure these filtered queries remain fast as the dataset grows.
