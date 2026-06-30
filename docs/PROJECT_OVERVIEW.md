# Project Overview: Game Zone and Pool Cafe Management System

## What is this project?
This is a software system built for managing a real Game Zone and Pool Cafe. The owner and the staff members will use this software to manage daily operations like customer entries, table bookings, game timers, food orders, and final billing. It will work on desktop, laptop, tablet, and mobile browsers.

## Main Goals
- **Save Time:** We want to make it very fast to assign tables and start game timers.
- **Correct Billing:** The system will calculate the bill automatically based on time played so there are no manual mistakes.
- **Reports:** The owner should be able to see how much money the cafe is making daily, weekly, and monthly.
- **Security:** We need to keep track of who is doing what, so we have separate logins for Admin (owner) and Staff.

## Core Features Breakdown

### 1. Login & Roles
- We are using Better Auth for login.
- There are two roles: Admin and Staff.
- Staff can't access owner settings or delete old records.

### 2. Customer Details
- We will keep a record of customers (Name, Phone number).
- We can track how much total money they spent.

### 3. Tables Management
- We have different things like Pool tables, PS5 consoles, and PC setups.
- We group them by "Table Types" (like VIP Pool, Standard PS5) because each type has a different hourly price.

### 4. Bookings
- Customers can book a table for tomorrow or next week.
- The system will make sure no two people book the same table at the same time.

### 5. Live Sessions & Timers
- **Countdown Timer:** If a customer pays for 1 hour in advance.
- **Overtime:** If the 1 hour is over but they keep playing, the system will add extra charges.
- **Pay Later (Open-Ended):** Start the timer, and when they finish, calculate the cost.
- We track this by saving the start time in the database, not by updating the database every single second.

### 6. Cafe POS (Food and Drinks)
- Staff can sell snacks and cold drinks.
- They can add the food bill to the customer's ongoing game session or sell directly to walk-in customers.

### 7. Billing
- When a game ends, the system creates one final bill.
- It adds the game time charge + any food they ordered.
- Staff can apply discounts and mark it as Paid (Cash, Card, or UPI).

### 8. Dashboard
- A simple screen where the staff can see all tables in a grid.
- Red color for occupied, Green for available, etc.

### 9. Reports
- Simple charts showing daily revenue.
- Showing which game console or table makes the most money.

### 10. Activity Logs
- We record every important click. For example, "Rahul (Staff) paused Table 2 at 4:30 PM".
