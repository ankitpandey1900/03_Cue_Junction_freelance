# Reports & Analytics Module

## Overview
The Reports Module provides business intelligence, financial tracking, and staff performance metrics. It is heavily protected by RBAC (Role-Based Access Control) and is exclusively accessible to users with the `ADMIN` role.

## Core Capabilities

### 1. Key Performance Indicators (KPIs)
Real-time metric cards displaying macro-level business health:
- Total Revenue (Day / Month / Year)
- Average Session Duration
- Total Active Customers
- Outstanding (Unpaid) Invoices Amount

### 2. Segmented Revenue Analysis
To provide actionable insights, revenue is explicitly split:
- **Gaming Revenue**: Money generated purely from Table/Session time.
- **Cafe Revenue**: Money generated from food and beverage sales.
- **Taxes & Discounts**: Separated out to provide a True Net Income metric.

### 3. Visual Charts & Trends
- **Hourly Traffic**: A bar chart mapping the busiest hours of the day (e.g., peak loads at 7 PM).
- **Weekly Trends**: A line chart showing revenue day-by-day to identify the most profitable days of the week.
- **Top Assets**: Ranks physical tables/consoles by generated revenue.
- **Top Cafe Items**: Identifies the best-selling food and drink items from the POS.

### 4. Staff Performance & Ledgers
- **Payment Ledger**: A raw, filterable table of all `Payment` records, showing exactly which staff member collected which payment, the payment method (UPI vs. Cash), and timestamps.
- This serves as the end-of-shift reconciliation tool for the cash register.

## Performance Architecture
- The dashboard utilizes parallelized aggregation queries (`Prisma.aggregate`) to crunch thousands of payment rows in milliseconds at the database level, preventing heavy JavaScript execution or memory bloat on the Node server.
