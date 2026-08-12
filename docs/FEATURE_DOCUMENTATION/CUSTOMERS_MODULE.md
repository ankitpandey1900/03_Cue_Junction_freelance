# Customers Module

## Overview
The Customers Module acts as a mini-CRM (Customer Relationship Management) system within the application. It tracks patron behavior, lifetime value, and maintains historical connections across bookings, sessions, and invoices.

## Core Capabilities

### 1. Directory & Profiles
- **Customer Directory**: A searchable, sortable list of all registered customers with at-a-glance metrics like total spend and loyalty points.
- **Detailed Profiles**: Clicking a customer opens a rich drawer view that acts as a central hub for that patron.
- **Transaction History**: Displays a paginated history of every past session the customer played, including duration and cost.

### 2. Lifetime Value & Loyalty
- **Automated Spend Tracking**: The `totalSpend` integer on the `Customer` table is atomically incremented by Prisma within the payment transaction every time an invoice linked to that customer is paid.
- **Loyalty Points**: A parallel currency system tracking reward points based on spend.

### 3. Integrated Workflows
- **Booking**: Customers are required for future reservations. The booking UI auto-suggests existing customers via a combobox search.
- **Session Assignment**: A walk-in session can optionally be linked to a customer mid-game, appending the final invoice to their profile upon checkout.

## Data Integrity
- Utilizes the `isArchived` soft-delete pattern. If a customer record is "deleted" by staff, the profile disappears from the directory and search dropdowns, but historical invoices and audit logs pointing to the customer ID remain perfectly intact.
