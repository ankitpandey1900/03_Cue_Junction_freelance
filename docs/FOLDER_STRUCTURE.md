# Folder Structure

We are grouping files by feature. This is called Feature-Based Architecture. It helps us find things easily when the project gets big.

```text
/
├── app/                        # Next.js Pages
│   ├── (auth)/                 # Login pages
│   ├── (dashboard)/            # Pages that need login
│   │   ├── page.tsx            # Main Home/Dashboard
│   │   ├── bookings/           # Booking pages
│   │   ├── cafe/               # Food POS pages
│   │   ├── customers/          # Customer list
│   │   ├── reports/            # Charts and stats
│   │   ├── sessions/           # Live game sessions
│   │   ├── settings/           # App settings
│   │   └── tables/             # Table management
│   ├── api/                    # API endpoints
│   └── layout.tsx              # Main layout file
├── features/                   # Core Logic goes here
│   ├── auth/                   
│   ├── bookings/               
│   ├── cafe/                   
│   ├── customers/              
│   ├── sessions/               # Example feature folder
│   │   ├── actions/            # Server actions for sessions
│   │   ├── components/         # React components only for sessions
│   │   ├── services/           # Math and DB logic for sessions
│   │   ├── schemas/            # Zod rules for sessions
│   │   └── types.ts            # TypeScript types for sessions
│   ├── billing/                
│   ├── tables/                 
│   ├── reports/                
│   └── settings/               
├── components/                 # Global UI Components
│   ├── ui/                     # shadcn components (buttons, inputs)
│   ├── layout/                 # Sidebar and Topbar
│   └── shared/                 # Things used everywhere
├── lib/                        # Helpers
│   ├── db.ts                   # Prisma setup
│   ├── utils.ts                # Small helper functions
│   └── auth.ts                 # Better Auth setup
├── prisma/                     # Database stuff
│   ├── schema.prisma           
│   └── migrations/             
├── public/                     # Images and icons
└── docs/                       # Project Documentation
```

## Basic Rules for this Folder
1. Do not put big database logic inside React components.
2. Put the Zod validations inside the `features` folder, not in a global folder, unless multiple features use it.
