# Decision 1: Choosing the Tech Stack

## What we needed
We need to build a fast, good-looking software for a Game Zone. It has to handle live timers and bills perfectly without slowing down.

## What we chose
We chose **Next.js 15** with **Prisma**, **PostgreSQL**, and **shadcn/ui**.

## Why we didn't choose other things
- We could have used normal React with a separate Node.js backend, but that takes more time to set up and write code for both sides.

## Why we chose this
- **Everything in one place:** Next.js lets us write the frontend and the database logic in the same project. This makes development faster.
- **Good looks:** `shadcn/ui` and `Tailwind CSS` make it very easy to build a premium-looking UI that looks like modern apps like Stripe or Vercel.
- **Types:** Because we use TypeScript everywhere, if we change a database column, the frontend will warn us if it breaks anything. This reduces bugs.
