# Cue Junction Cafe - Management System

This is the unified management system I built for Cue Junction Cafe. It acts as a single, low-latency control center for active, pausable table sessions (like Pool tables or PlayStation consoles) and a complete Cafe order system.

The system is built on **Next.js 15 (App Router)**, **Prisma ORM**, and **PostgreSQL (Supabase)**, utilizing **Better Auth** for secure, role-based session auditing.

---

## 1. Quick Start (Local Setup)

Follow these steps to run the application locally on your machine:

### Step 1: Install Dependencies
Clone the repository and install all node packages:
```bash
npm install
```

### Step 2: Configure Environment Variables
Create a local `.env` file in the root of the project. You can copy the template I defined in `.env.example`:
```bash
cp .env.example .env
```
Ensure you populate your actual PostgreSQL URLs (I support connection pooling through Supabase) and generate a secure string for `BETTER_AUTH_SECRET`.

### Step 3: Run Database Migrations
Synchronize your Prisma schema with the PostgreSQL target instance:
```bash
npx prisma db push
```
This command compiles the schema definitions and maps the index keys, constraints, and tables.

### Step 4: Seed the Database
Populate your database with the default system configurations and initial credentials:
```bash
npx prisma db seed
```
*Note: This creates two default users you can use to sign in:*
- **Admin Login:** `admin@cuejunction.com` (Password: `password123`)
- **Staff Login:** `staff@cuejunction.com` (Password: `password123`)

### Step 5: Start the Development Server
Launch the application locally running on top of the Turbopack engine:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 2. Core Scripts Reference

- `npm run dev` - Boots the local Next.js development server with hot module replacement (Turbopack enabled).
- `npm run build` - Compiles a production-ready static build, compiling all Server Components and performing strict TypeScript type validation checks.
- `npm run start` - Starts the compiled production server.
- `npx prisma studio` - Launches a local GUI dashboard in your browser to view and edit database rows directly.

---

## 3. Directory Layout & Architecture

I structured the project using a domain-driven **Feature-Sliced Design (FSD)** layout located inside the `features/` directory:

```text
features/
  ├── auth/            # Sign-in forms and user session actions
  ├── billing/         # Invoices, mixed payment registries, and PDF layouts
  ├── cafe/            # Menu categories, inventory, and order snapshots
  ├── customers/       # Loyalty CRM and historical customer profiles
  ├── logs/            # Shift activity audit trail and logs viewer
  ├── sessions/        # Play timers, temporal states, and pause tracking
  ├── settings/        # Global parameters (GST configs, store name)
  └── tables/          # Table assets, physical grids, and hourly rate types
```

Each folder houses its own:
- `actions/` - Secure Server Actions validating data shapes with Zod schemas.
- `components/` - React views and components tied specifically to that feature.
- `services/` - Direct Prisma queries and transaction hooks executing data mutations.

---

## 4. Documentation Suite

This project comes with a comprehensive suite of technical documentation. Please refer to the `/docs` directory for deep-dives into the architecture:

- **`docs/PROJECT_OVERVIEW.md`**: High-level overview of the unified system, pausable timers, and pricing.
- **`docs/SYSTEM_DESIGN.md`**: Architectural breakdown of the state machines, table switching, and pricing engine logic.
- **`docs/PRICING_ENGINE_MATH.md`**: Detailed mathematical formulas used for session billing, overtime packages, and extra charges.
- **`docs/API_REFERENCE.md`**: Specification of the Next.js Server Actions used for the internal API.
- **`docs/DATABASE_DESIGN.md` & `docs/ER_DIAGRAM.md`**: Strict relational schemas and structural entity maps.
- **`docs/FEATURE_DOCUMENTATION/`**: Detailed explainers for individual modules (Settings, Reports, Activity Logs, Customers, PWA).

