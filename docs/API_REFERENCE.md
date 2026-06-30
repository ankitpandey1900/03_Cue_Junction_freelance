# Server Actions and API Guide

This file explains the main functions we use to talk to the database. We are using Next.js Server Actions.

## The Basic Rule
Every Server Action will do these steps:
1. **Check Login:** Make sure the person is logged in.
2. **Check Data:** Make sure they sent the right data (using Zod).
3. **Do the Logic:** Check if tables are free, do math, etc.
4. **Update Screen:** Tell Next.js to refresh the UI (`revalidatePath`).
5. **Return Result:** Send back `{ success: true, data: ... }` or an error message.

## Game Sessions

### `startSession(data)`
- **What it does:** Starts a new live game timer.
- **How it works:** 
  - Checks if the table is empty.
  - Marks the table as OCCUPIED.
  - Creates a Session in DB and saves `startTime`.
  - Saves an activity log.

### `pauseSession(sessionId)`
- **What it does:** Pauses the live timer.
- **How it works:**
  - Calculates how much time they played until now.
  - Adds that time to `totalPauseDurationSeconds`.
  - Changes the status to PAUSED.

### `endSession(sessionId)`
- **What it does:** Stops the game and creates the final bill.
- **How it works:**
  - Saves `endTime`.
  - Makes the table AVAILABLE again.
  - Creates an Invoice combining the game time cost and any food they ordered.

## Bookings

### `createBooking(data)`
- **What it does:** Books a table for later.
- **How it works:** 
  - Checks the database to make sure no one else has booked that same table at that time. If yes, it shows an error.

## Cafe / Food POS

### `addOrderToSession(data)`
- **What it does:** Adds a food item to a playing customer's bill.
- **How it works:**
  - Checks if the game is still active.
  - Reduces the item stock (like minus 1 Pepsi).
  - Links the food order to the `sessionId`.

## Billing

### `recordPayment(data)`
- **What it does:** Saves that we got the money.
- **How it works:**
  - Checks if the money given matches the bill.
  - Saves a `Payment` record (Cash, UPI, or Card).
  - If fully paid, marks the Invoice as PAID.
