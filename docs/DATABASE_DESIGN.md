# Database Design

## Overview
We are using **PostgreSQL** database and connecting to it using **Prisma**. We have linked tables together properly so that if we delete something, the related data is handled safely.

## Tables and Why We Need Them

### `User`
- **What it is:** For Admin and Staff logins.
- **Why we need it:** We need to know who is using the system so we can track their actions in the activity logs.

### `Customer`
- **What it is:** Saves customer details like phone number and name.
- **Why we need it:** We want to know our regular customers. We will track how much money they have spent in total (`totalSpend`) so we can maybe give them discounts later.

### `TableType`
- **What it is:** Groups of tables, like "PS5 Section" or "Pool Tables".
- **Why we need it:** Because playing on a PS5 might cost ₹150/hour, but playing Pool might cost ₹200/hour. We set the price here instead of hardcoding it.

### `Table`
- **What it is:** The actual physical tables or game consoles.
- **Why we need it:** The dashboard will show a map of these tables so staff can see which ones are empty.

### `Booking`
- **What it is:** When someone calls to reserve a table for later.
- **Why we need it:** To block the time so nobody else can book the same table at the same time.

### `Session`
- **What it is:** The live game happening right now.
- **Why we need it:** This is the most important part. It tracks when the game started. 
- **Important Note:** We only save the `startTime` in the database. We do not update it every minute. 

### `MenuItem`, `Order`, and `OrderItem`
- **What it is:** The food and drinks menu.
- **Why we need it:** Customers will buy Pepsi and chips while playing. We can add this to their game bill or just sell it normally to a walk-in customer.

### `Invoice` and `Payment`
- **What it is:** The final bill and the money received.
- **Why we need it:** An invoice is the final calculated bill. Once made, the prices on it will not change. A single invoice can be paid half in Cash and half in UPI, so we keep `Payment` separate.

### `ActivityLog`
- **What it is:** A record of every click or action.
- **Why we need it:** If the cash collection is short at night, the owner can check the logs to see if a staff member deleted a bill or ended a session early.
