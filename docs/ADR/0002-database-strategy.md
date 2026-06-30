# Decision 2: How the Timer Works

## The Problem
When a customer plays PS5, we need to show a live timer on the screen. The easy way is to run a timer in the browser that updates the database every minute (saying "1 minute played", "2 minutes played").

## The Decision
We will **NOT** update the database every minute.
We will only save the exact `startTime` in the database.

## Why the easy way is bad
- If we have 20 tables playing, updating the database every minute for all tables is bad. It puts too much load on the database for no reason.

## Why our way is better
- **Fast:** We only write to the database when they Start, Pause, or End the game.
- **Safe:** If the computer shuts down or internet goes off, the server still knows exactly when they started. When the staff turns on the computer again, the browser just checks the `startTime` and shows the exact correct time.

## How it works for Billing
When the game ends, the backend calculates the final time itself. It does not trust the browser. This means nobody can cheat the timer.
