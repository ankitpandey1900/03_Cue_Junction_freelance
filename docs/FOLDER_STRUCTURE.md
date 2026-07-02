# Folder Structure (Feature-Sliced Design)

If you've ever worked on a massive React codebase where `src/components` has 400 files in it, you know why I chose to structure this project differently. 

I adopted a domain-driven, vertical-slice architecture. I grouped code by **what it does** (the feature), rather than **what it is** (a component, an action, etc.).

## The Root Directory
I explicitly decided against a `src/` folder. This keeps the core domains right at the surface, eliminating unnecessary nesting and keeping the tree extremely readable.

```text
03_Cue Junction Cafe/
 ├── app/               # Next.js App Router (Pages, Layouts, Routing)
 ├── components/        # Pure UI components ONLY (Buttons, Inputs, Dialogs)
 ├── docs/              # You are here.
 ├── features/          # The actual brains of the application
 ├── lib/               # Global singletons (Prisma client, Better Auth config)
 ├── prisma/            # Database schema and migrations
 └── public/            # Static assets (Favicons, logos)
```

## The `features/` Directory Deep Dive
This is where 90% of your development time will be spent. Every major domain has its own folder. 
If you are fixing a bug in the Cafe menu, you do not need to care about the `sessions` folder. Everything you need is co-located.

Inside a typical feature folder (e.g., `features/cafe/`), you will find:
- `actions/`: Next.js Server Actions. This is the controller layer. It receives data from the client, validates it with Zod, checks auth, and calls the service layer.
- `components/`: React components specifically tied to this domain. A `CategoryManager.tsx` belongs here, not in the global `components/` folder, because it is useless outside of the Cafe domain.
- `schemas/`: Zod schemas. I define exactly what the shape of the data must look like before it hits the database.
- `services/`: Prisma queries. Pure Node.js functions. No HTTP, no React. Just raw business logic and database transactions.

### Current Domains
- `auth`: Login forms and session management UI.
- `billing`: Invoice generation, payments, and PDF rendering views.
- `cafe`: Menu items, categories, stock management, and POS logic.
- `customers`: Customer CRM, loyalty points, and history.
- `logs`: System-wide audit trails (tracking exactly who paused a session and when).
- `sessions`: The complex temporal logic of active, pausable table sessions.
- `settings`: Global cafe configuration (tax rates, business name).
- `tables`: Physical table definitions and pricing models.
