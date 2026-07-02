import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { LogoutButton } from "@/features/auth/components/LogoutButton"
import { SidebarNav } from "@/components/layout/SidebarNav"
import { MobileSidebar } from "@/components/layout/MobileSidebar"

const navItems = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" as const },
  { href: "/tables", label: "Tables", icon: "TableProperties" as const },
  { href: "/sessions", label: "Sessions", icon: "Timer" as const },
  { href: "/customers", label: "Customers", icon: "Users" as const },
  { href: "/bookings", label: "Bookings", icon: "CalendarCheck" as const },
  { href: "/cafe", label: "Cafe", icon: "ShoppingCart" as const },
  { href: "/invoices", label: "Invoices", icon: "Receipt" as const },
  { href: "/reports", label: "Reports", icon: "BarChart3" as const, adminOnly: true },
  { href: "/logs", label: "History", icon: "ScrollText" as const, adminOnly: true },
  { href: "/settings", label: "Settings", icon: "Settings" as const, adminOnly: true },
]

import { AutoRefresh } from "@/components/AutoRefresh"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const isAdmin = session.user.role === "ADMIN"
  const visibleNavItems = navItems.filter((item) => isAdmin || !item.adminOnly)

  return (
    <div className="min-h-screen flex bg-background">
      <AutoRefresh intervalMs={30000} />
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-sidebar z-20">
        {/* Brand */}
        <div className="flex h-14 items-center gap-2.5 px-5 border-b border-border">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">CJ</span>
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">Cue Junction</span>
        </div>

        {/* Navigation */}
        <SidebarNav navItems={visibleNavItems} />

        {/* User section */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 mb-3 px-1">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
              {(session.user.name || session.user.email)?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground truncate leading-none">
                {session.user.name || session.user.email}
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {isAdmin ? "Admin" : "Staff"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <LogoutButton />
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-60 z-10 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <MobileSidebar
              navItems={visibleNavItems}
              userName={session.user.name || session.user.email || "User"}
              userRole={isAdmin ? "Admin" : "Staff"}
            />
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">CJ</span>
            </div>
            <span className="text-sm font-semibold text-foreground">Cue Junction</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
