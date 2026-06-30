# Development Steps

This is the step-by-step plan for building the system.

**Please approve before I start writing any code for Phase 1.**

## Phase 0: Planning (We are here)
- Create all the documents, database diagrams, and plans.
- **Goal:** Make sure we both agree on how the app will work.

## Phase 1: Project Setup
- Install Next.js 15, Tailwind, and shadcn/ui.
- Setup Prisma database connection.
- Create the folders as per our plan.

## Phase 2: Database Setup
- Push the tables to the PostgreSQL database.
- Add an Admin user to start testing.

## Phase 3: Login (Auth)
- Setup Better Auth.
- Create the Login page.
- Make sure unlogged users can't see the dashboard.

## Phase 4: Customers
- Build the page to see, add, and edit customers.
- Write the backend code to save customers to the database.

## Phase 5: Tables
- Add the pages to manage Table Types (like setting ₹150 for PS5).
- Add the pages to add physical tables.

## Phase 6: Bookings
- Build the calendar UI.
- Write the logic to make sure nobody double-books the same table.

## Phase 7: Live Games (The Main Part)
- Build the Live Dashboard with timers.
- Write the logic for starting, pausing, and ending games.
- Make sure the timer runs smoothly without crashing the database.

## Phase 8: Food and Cafe (POS)
- Add the page to manage snacks and drinks.
- Build the screen so staff can add Pepsi to a customer's game bill.

## Phase 9: Billing
- Write the math logic to calculate the final bill (game time + food).
- Save the Invoice and Payments.

## Phase 10: Dashboard View
- Build the nice visual map of all tables so staff can see what is empty or occupied at a glance.

## Phase 11: Reports
- Add charts to show daily sales.

## Phase 12: Settings and Logs
- Add the page to change shop name or GST.
- Add the page where owner can see what the staff clicked today.

## Phase 13: Final Testing
- We will test everything like a real customer walking in, playing, eating, and paying.

## Phase 14: Going Live
- Host the code on Vercel.
- Connect to the real database.
