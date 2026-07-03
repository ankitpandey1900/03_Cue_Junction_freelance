"use client"

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
  ChevronRight,
} from "lucide-react"

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

interface NavItem {
  href: string
  label: string
  icon: IconName
  adminOnly?: boolean
}

interface SidebarNavProps {
  navItems: NavItem[]
}

export function SidebarNav({ navItems }: SidebarNavProps) {
  const pathname = usePathname()

  const adminItems = navItems.filter((i) => i.adminOnly)
  const mainItems = navItems.filter((i) => !i.adminOnly)

  const renderNavGroup = (items: NavItem[], title: string) => (
    <div className="mb-4">
      <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const IconComponent = iconsMap[item.icon]
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all duration-150 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
              )}
              <IconComponent
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? "text-primary" : ""
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-primary/60" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )

  return (
    <nav className="flex-1 py-4 px-3 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {renderNavGroup(mainItems, "Navigation")}
      {adminItems.length > 0 && renderNavGroup(adminItems, "Admin")}
    </nav>
  )
}
