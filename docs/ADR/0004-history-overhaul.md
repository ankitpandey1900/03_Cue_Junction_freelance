# ADR 0004: Overhauling Audit Logs to Tabular History & Standardizing IDs

**Status:** Accepted
**Date:** July 2026

## Context and Problem Statement
I originally built a low-level, developer-style Audit Log reader (`AuditLogTable`) to record actions. However, it had several issues:
1. It displayed raw database IDs (CUIDs starting with `cmr...`) directly in dropdowns and audit fields, which looked messy and unprofessional.
2. The UI table structure suffered from a React hydration error because of extra whitespace text nodes inside table rows (`<tr>`).
3. The logs were noisy and hard to read, capturing developer-level JSON state diffs that took up massive screen space instead of summarizing business outcomes.

## Considered Options
1. **Fix the legacy AuditLogTable component** and leave the raw logs.
2. **Convert/Replace Audit Logs** with a structured **History Feed** using a compact table representation and a pop-up details dialog.

## Decision Outcome
**Chosen option: Convert/Replace Audit Logs with a structured History Feed & standard UUIDs**

I decided to completely overhaul this system:
- **Clean IDs:** I switched from CUIDs (`cuid()`) to industry-standard, professional UUIDs (`uuid()`) site-wide for all database entities. No more `cmr...` showing up.
- **Tabular History with Dialog Drill-down:** I replaced the noisy, bloated audit cards with a compact, responsive data table (`/logs`) representing chronological actions. To keep it clean:
  - The rows only display key data points: timestamp, action description badge, subject entity, and actor name.
  - Clicking a row triggers a modal `DetailDialog` that parses the action metadata and presents it in a structured layout (e.g. details of edited settings, specific amount/payment method).
- **Server-Side Pagination:** To guarantee high performance, I limited the feed to exactly **20 items per page**, implemented via Prisma's `take` and `skip`.
- **Batch Querying:** I resolved the potential N+1 query issue by batch-fetching the ActivityLog and related User/Invoice entities in a single, clean database query.

## Consequences
- **Positive:** Sleek, modern, and highly professional layout. Looks clean on mobile screens.
- **Positive:** Resolved the React hydration whitespace warning once and for all by removing the old layout code.
- **Positive:** Performance remains extremely high because we do not load hundreds of legacy database log objects into memory at once.
