# Route Structure (App Pages)

Here is how we organized the pages in Next.js App Router.

## Page Folders

```text
/
├── (auth)/                         # Pages where you don't need login
│   ├── login/                      # The login page
│   └── reset-password/             # To reset password
├── (dashboard)/                    # Pages that require staff/admin login
│   ├── page.tsx                    # The main dashboard with table grid
│   ├── bookings/                   
│   │   ├── page.tsx                # View all bookings
│   │   └── new/                    # Create a new booking
│   ├── cafe/                       
│   │   ├── page.tsx                # Sell food to walk-in customers
│   │   └── inventory/              # Add or edit menu items
│   ├── customers/                  
│   │   ├── page.tsx                # List of all customers
│   │   └── [id]/                   # See history of one specific customer
│   ├── reports/                    
│   │   ├── page.tsx                # Sales charts
│   │   └── export/                 # Download data to Excel
│   ├── settings/                   
│   │   ├── page.tsx                # Change GST, shop name, etc
│   │   ├── staff/                  # Add or remove staff accounts
│   │   └── activity/               # View the logs of who did what
│   └── tables/                     
│       ├── page.tsx                # Add or remove physical tables
│       └── types/                  # Edit hourly prices for games
```

## How the Layout Works
- The pages inside `(dashboard)` have a Sidebar and a Top Header.
- Before anyone can open these pages, Next.js will check if they are logged in. If not, they get redirected to `/login`.

## Admin Only Pages
- Only the Owner (Admin) can see pages like `settings/staff` and `reports/export`. We will check `role === ADMIN` in the code to stop Staff from opening them.
