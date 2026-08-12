# Activity Logs & Auditing Module

## Overview
The Activity Logs module acts as the unalterable source of truth for administrative oversight. It records every significant state mutation across the system to prevent fraud, track errors, and monitor staff behavior.

## Core Capabilities

### 1. Global Audit Trail
The system automatically logs:
- Session modifications (Starting, Pausing, Resuming, Ending)
- Billing events (Generating Invoices, Receiving Payments, Applying Discounts)
- Deletions (Archiving Invoices, Customers, Tables)
- Cafe mutations (Updating stock, changing menu prices)

### 2. Entity Traceability
Every log entry (`ActivityLog` model) strictly enforces:
- `userId`: Which authenticated staff member performed the action.
- `action`: What they did (e.g., `INVOICE_GENERATED`, `SESSION_PAUSED`).
- `entityType` & `entityId`: What exact record was mutated.
- `createdAt`: An immutable UTC timestamp.

### 3. Log Viewer Interface
- An Admin-only dashboard route (`/logs`) provides a searchable, paginated table of the audit trail.
- Admins can filter logs by Staff Member, Date Range, or Action Type.

## Security Guarantees
- The `ActivityLog` table is strictly append-only. There are no API routes or server actions exposed that allow updating or deleting a log.
- Deleting a staff user account is restricted at the database level if they have historical activity logs, ensuring the audit trail can never be orphaned.
