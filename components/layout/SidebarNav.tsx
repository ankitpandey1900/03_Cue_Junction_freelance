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
} as const

type IconName = keyof typeof iconsMap

interface NavItem {
  href: string
  label: string
  icon: IconName
}

interface SidebarNavProps {
  navItems: NavItem[]
}

export function SidebarNav({ navItems }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
  )
}
