# Route Structure (Next.js App Router)

I are heavily leveraging the Next.js 15 App Router. The goal here is to keep the URLs clean for the client while organizing the UI logically under the hood.

## The `(dashboard)` Route Group
You'll notice almost all of my routes are wrapped inside `app/(dashboard)/`. 
By using the parenthesis syntax, Next.js ignores `(dashboard)` in the actual URL path. I did this because I wanted to wrap the entire internal application in a single unified `layout.tsx` (which contains the sidebar, navigation, and auth checks) without forcing the URL to look like `/dashboard/tables`. It just resolves to `/tables`.

```text
app/
 ├── (dashboard)/
 │    ├── layout.tsx             # Global sidebar and requireSession() wrapper
 │    ├── loading.tsx            # Global Suspense boundary for instantaneous route transitions
 │    ├── page.tsx               # The main overview dashboard (Resolves to `/`)
 │    ├── cafe/                  # Resolves to `/cafe`
 │    │    ├── manage/           
 │    │    │    ├── categories/  # Resolves to `/cafe/manage/categories`
 │    │    │    └── items/       # Resolves to `/cafe/manage/items`
 │    │    └── page.tsx
 │    ├── customers/             # Resolves to `/customers`
 │    ├── invoices/              # Resolves to `/invoices`
 │    ├── logs/                  # Resolves to `/logs` (History & Audits)
 │    ├── sessions/              # Resolves to `/sessions` (Active tables)
 │    ├── settings/              # Resolves to `/settings`
 │    └── tables/                # Resolves to `/tables`
 │
 ├── api/
 │    └── auth/
 │         └── [...all]/         # Better Auth catch-all API route
 │
 ├── login/                      # Resolves to `/login` (Outside the dashboard layout)
 └── globals.css
```

## Security at the Edge
Because `(dashboard)` shares a single `layout.tsx`, I enforce authentication at the layout level. If a user without a valid session tries to hit `/tables` or `/invoices`, they are immediately redirected to `/login`. This is much cleaner than writing auth checks inside every single page component.
