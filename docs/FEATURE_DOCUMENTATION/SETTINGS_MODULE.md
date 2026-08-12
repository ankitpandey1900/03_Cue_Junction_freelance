# Settings Module

## Overview
The Settings Module is a centralized configuration hub for administrators. It manages the global behavior of the Cue Junction Cafe system, allowing dynamic updates to pricing models, cafe configuration, and system-wide toggles without requiring code changes.

## Core Capabilities

### 1. Cafe Configuration (`CafeSettings`)
A global singleton table that dictates core business details printed on invoices and controls application behavior:
- **Business Details**: Cafe Name, Address, Phone, Email, GSTIN.
- **Receipt Customization**: Configurable footer text for printed receipts.
- **Payment Toggles**: Checkboxes to enable/disable specific payment methods (UPI, Card, Cash) dynamically across the billing workflows.
- **Tax Rules**: Global tax percentage application.

### 2. Advanced Table Pricing
Table pricing isn't limited to a simple hourly rate. The module allows configuring complex billing algorithms for different physical assets:
- **Standard Hourly**: Base rate calculated per minute.
- **Minimum Charge**: Absolute minimum floor price for a session, regardless of how short the play time is.
- **Fixed Rate / Prepaid (e.g., PS5 packages)**: A fixed upfront cost for a specific duration (e.g., ₹200 for 60 minutes).
- **Overtime Rate**: A different, usually higher, hourly rate that kicks in automatically once the prepaid `fixedDuration` expires.

### 3. Staff Management (RBAC integration)
- A dedicated interface for managing the `User` table.
- Admins can invite new staff members, reset passwords, or archive/deactivate staff accounts.
- Modifying staff roles dynamically restricts or grants access to protected routes (like Reports and Settings).

## Implementation Details
- Uses Server Actions with `revalidatePath("/")` to ensure that any change to pricing or taxes instantly propagates to all active sessions across the dashboard.
- Protects against malicious tampering by verifying `isAdmin()` on all settings mutation routes.
