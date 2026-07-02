# ADR 0003: Play Session Timing & Billing Engine

**Status:** Accepted
**Date:** June 2026

## Context and Problem Statement
I needed a foolproof billing engine for table sessions (Pool, PlayStation, etc.) where time translates directly to money. The system had to survive client browser closures, network disconnects, server restarts, and potential client-side timer tampering. It also needed to handle pauses (e.g. when a customer takes a break) without dropping a single second of billing precision.

## Considered Options
1. **Client-side Timers:** Run a JavaScript interval in the browser and send the final elapsed time to the server on session end.
2. **Server-side Background Cron/Intervals:** Spin up a Node.js timeout or cron job for each active table to track elapsed time.
3. **Database Timestamp Diffing (Stateless/Event-driven):** Store starting, ending, and pause timestamps in the database. Calculate duration on-demand using SQL/Server timestamps.

## Decision Outcome
**Chosen option: Database Timestamp Diffing (Stateless/Event-driven)**

I immediately discarded option 1. Never trust the client. Any tech-savvy kid could edit the JavaScript variable in DevTools and play for three hours while paying for ten minutes.
I also ruled out option 2. If the Next.js server restarts (or crashes and recovers) during a deployment, all running background memory intervals are lost, causing live timers to freeze or reset.

Instead, I built a stateless engine inside the `Session` model:
- When a session starts, I stamp `startTime = now()` in the database.
- The UI runs a dummy visual timer for the user, but the **true** duration is always computed by comparing `now()` (or `endTime`) against `startTime`.
- **State Machine (`ACTIVE`, `PAUSED`, `COMPLETED`):** To handle pauses, I added `lastPausedAt` and `totalPauseDurationSeconds` to the model.
  - When paused, I set `lastPausedAt = now()`.
  - When resumed, I calculate `now() - lastPausedAt` in seconds, add that delta to `totalPauseDurationSeconds`, and set `lastPausedAt = null`.
- **Cost Calculations:** When calculating costs, the active duration is defined as: `totalElapsedSeconds - totalPauseDurationSeconds`.

## Consequences
- **Positive:** Absolute resilience. The server can crash, the browser tab can close, or the power can cut out—the billing math is always pristine because it relies on database timestamp differences.
- **Positive:** Tamper-proof. No client-side values are trusted; all billing math is calculated strictly server-side during checkout.
- **Negative:** Requires careful state tracking and calculations when rendering active timers in the React components, but I solved this by exporting helper utility functions (`formatDuration`) shared between the client and server.
