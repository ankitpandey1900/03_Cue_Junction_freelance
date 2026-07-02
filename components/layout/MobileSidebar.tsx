"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  TableProperties,
  Timer,
  ShoppingCart,
  Receipt,
  BarChart3,
  ScrollText,
  Settings,
  CalendarCheck,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/features/auth/components/LogoutButton"

const iconsMap = {
  LayoutDashboard,
  Users,
  TableProperties,
  Timer,
  ShoppingCart,
  Receipt,
  BarChart3,
  ScrollText,
  Settings,
  CalendarCheck,
} as const

type IconName = keyof typeof iconsMap

interface MobileSidebarProps {
  navItems: { href: string; label: string; icon: IconName }[]
  userName: string
  userRole: string
}

export function MobileSidebar({ navItems, userName, userRole }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="relative flex w-[min(18rem,85vw)] h-dvh flex-col bg-background border-r border-border z-50 animate-in slide-in-from-left duration-200 shadow-2xl">
            {/* Header */}
            <div className="flex h-14 items-center justify-between px-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary-foreground">CJ</span>
                </div>
                <span className="text-sm font-semibold text-foreground">Cue Junction</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Nav */}
            <nav className="flex-1 min-h-0 py-3 px-3 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => {
                const IconComponent = iconsMap[item.icon]
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <IconComponent className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* User */}
            <div className="border-t border-border p-3 shrink-0">
              <div className="flex items-center gap-2.5 mb-3 px-1">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                  {userName[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate leading-none">{userName}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {userRole === "Admin" ? "Administrator" : "Staff"}
                  </p>
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
