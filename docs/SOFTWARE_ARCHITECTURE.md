# Software Architecture

## The Stack
I went with a heavily opinionated, modern TypeScript stack to ensure type safety from the database all the way to the DOM.

- **Framework:** Next.js (App Router)
- **Language:** TypeScript (Strict mode enabled)
- **Database:** PostgreSQL (Hosted on Supabase via IPv4 pooling)
- **ORM:** Prisma
- **Auth:** Better Auth
- **Styling:** Tailwind CSS + Radix UI (shadcn/ui)

## Architectural Patterns

### Feature-Sliced Design (FSD)
I explicitly avoided the traditional "everything in `components/` and `pages/`" monolith approach. As applications grow, that structure becomes an unmaintainable dumping ground. 

Instead, I adopted a vertical slice architecture housed within the `features/` directory. Each domain (`cafe`, `sessions`, `billing`, `tables`) acts as its own self-contained module. 
If you need to change how a cafe order works, you don't hunt across the entire codebase. You go to `features/cafe/` and you'll find the schemas, services, server actions, and UI components all co-located. This significantly reduces cognitive load and prevents spaghetti dependencies.

```text
features/
  ├── cafe/
  │   ├── actions/      # Next.js Server Actions (The Controller layer)
  │   ├── components/   # React Client/Server components specific to the cafe
  │   ├── schemas/      # Zod validation schemas
  │   └── services/     # Prisma database queries (The Data layer)
  └── sessions/
      └── ...
```

### The Data Flow (Server Actions & Services)
I heavily utilize React Server Components (RSC) and Next.js Server Actions to eliminate the need for a traditional REST API layer.

1. **Client UI:** A user interacts with a React component (e.g., clicking "Pause Session").
2. **Server Action (`actions/`):** The component calls a Server Action. The action is responsible for:
   - **Auth Validation:** Calling `requireSession()` or `requireAdmin()`.
   - **Data Validation:** Parsing incoming payloads against my Zod schemas.
   - **Error Handling:** Catching exceptions and formatting them gracefully for the client.
3. **Service Layer (`services/`):** If validation passes, the Action delegates the heavy lifting to the Service layer. The service layer is pure Node.js/Prisma logic. It handles the complex `$transaction` blocks and raw data manipulation.
4. **Revalidation:** Once the service returns successfully, the Action calls `revalidatePath('/sessions')` to instantly bust the Next.js router cache, seamlessly updating the client UI without a hard refresh.

### The Presentation Layer
I use `shadcn/ui` built on top of Radix UI for highly accessible, unstyled headless components that I theme via Tailwind. The dashboard is wrapped in strategic `Suspense` boundaries (`loading.tsx`), ensuring that route transitions feel instantaneous and non-blocking, maintaining a 60fps feel even when pulling heavy data from Postgres.
