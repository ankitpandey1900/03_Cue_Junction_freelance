# Feature: Live Session Management

## Overview
I built the **Live Session Management** engine as the core timing heartbeat of the cafe. It allows staff members to track real-time gaming or billiard table usage, handle temporary customer pauses, change tables on the fly, and calculate precise, automated billing down to the second.

---

## Core Mechanics

### 1. The Timing State Machine
To survive page refreshes, browser tab closures, and server redeployments, I avoided keeping state in-memory. Instead, the session state is managed directly in the database (`Session` model) using three statuses:

- **`ACTIVE`:** Stamped with a `startTime`. The elapsed duration is calculated as:
  $$\text{duration} = \text{now()} - \text{startTime} - \text{totalPauseDurationSeconds}$$
- **`PAUSED`:** The billing clock is temporarily frozen. I stamp the database with `lastPausedAt = now()`. The visual timer in the UI turns amber and pauses.
- **`COMPLETED`:** Stamped with a final `endTime`. The billing time is locked.

### 2. Pause & Resume Math
When a staff member resumes a paused session:
1. I calculate the duration of the pause: `pauseDelta = now() - lastPausedAt`.
2. I add this `pauseDelta` (in seconds) to the cumulative `totalPauseDurationSeconds` field in the database.
3. I clear `lastPausedAt` back to `null` and set the status back to `ACTIVE`.

This stateless design ensures that if the server crashes or restarts mid-session, no calculation is lost.

### 3. Dynamic Cost Calculation
Different tables can have complex table type rate structures. The cost calculator in `session.service.ts` processes these rules in order:
- **Minimum Charge:** If a session lasts only 2 minutes, I still charge the `minimumCharge` defined for that table type (e.g. ₹75).
- **Fixed Packages:** If a table type uses fixed pricing (e.g. ₹200 for 1 hour), I charge exactly the fixed rate for any duration up to that limit.
- **Overtime Rollover:** If the session exceeds the fixed package duration, the system automatically bills the remaining minutes at the configured `overtimeHourlyRate`.
- **Hourly Pricing:** For standard rate types, we bill linearly based on the exact minutes played:
  $$\text{cost} = \left(\frac{\text{activeMinutes}}{60}\right) \times \text{hourlyRate}$$

### 4. Table Switching
If a customer wants to switch from Table A to Table B:
1. I run a transaction that frees Table A (sets status to `AVAILABLE`).
2. I set Table B's status to `OCCUPIED`.
3. I update the `tableId` on the active `Session` record and log a `TABLE_SWITCHED` event.
4. All existing cafe orders and elapsed times roll over to the new table automatically.
