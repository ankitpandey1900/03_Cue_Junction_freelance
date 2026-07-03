"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
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
  LogOut,
  ChevronRight,
} from "lucide-react"
import { LogoutButton } from "@/features/auth/components/LogoutButton"
import { ThemeToggle } from "@/components/shared/ThemeToggle"

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
  navItems: { href: string; label: string; icon: IconName; adminOnly?: boolean }[]
  userName: string
  userRole: string
}

export function MobileSidebar({ navItems, userName, userRole }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Swipe-to-close
  const touchStartX = useRef<number>(0)
  const touchCurrentX = useRef<number>(0)
  const drawerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close on pathname change (navigation complete)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    isDragging.current = true
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return
    touchCurrentX.current = e.touches[0].clientX
    const delta = touchCurrentX.current - touchStartX.current
    if (delta < 0 && drawerRef.current) {
      drawerRef.current.style.transform = `translateX(${delta}px)`
      drawerRef.current.style.transition = "none"
    }
  }

  function handleTouchEnd() {
    if (!isDragging.current || !drawerRef.current) return
    isDragging.current = false
    const delta = touchCurrentX.current - touchStartX.current
    drawerRef.current.style.transition = ""
    drawerRef.current.style.transform = ""
    if (delta < -60) {
      setOpen(false)
    }
    touchStartX.current = 0
    touchCurrentX.current = 0
  }

  // Split nav into main and admin sections
  const adminItems = navItems.filter((i) => i.adminOnly)
  const mainItems = navItems.filter((i) => !i.adminOnly)

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const drawerContent = (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-[3px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

        {/* Drawer panel */}
        <div
          ref={drawerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`absolute left-0 inset-y-0 w-[min(19rem,88vw)] flex flex-col bg-background border-r border-border shadow-2xl transition-transform duration-300 ease-out will-change-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shadow-sm">
                <span className="text-[11px] font-extrabold text-primary-foreground tracking-tight">CJ</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground leading-none">Cue Junction</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Management System</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Nav scroll area */}
          <nav className="flex-1 min-h-0 overflow-y-auto py-3 px-3">
            {/* Main items */}
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Navigation
            </p>
            <div className="space-y-0.5">
              {mainItems.map((item) => {
                const IconComponent = iconsMap[item.icon]
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`group relative flex items-center gap-3 px-3 py-3 text-[13px] font-medium rounded-lg transition-all duration-150 ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {/* Active left accent bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                    )}
                    <IconComponent className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-primary" : ""}`} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary/60" />}
                  </Link>
                )
              })}
            </div>

            {/* Admin section */}
            {adminItems.length > 0 && (
              <div className="mt-4">
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Admin
                </p>
                <div className="space-y-0.5">
                  {adminItems.map((item) => {
                    const IconComponent = iconsMap[item.icon]
                    const isActive =
                      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`group relative flex items-center gap-3 px-3 py-3 text-[13px] font-medium rounded-lg transition-all duration-150 ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                        )}
                        <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                        <span className="flex-1">{item.label}</span>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary/60" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </nav>

          {/* User card at bottom */}
          <div className="shrink-0 border-t border-border/60 p-3 space-y-2">
            <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-muted/40">
              <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{initials || "?"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-foreground truncate leading-tight">{userName}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                    userRole === "Admin"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-blue-500/15 text-blue-400"
                  }`}>
                    {userRole}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-1">
              <div className="flex-1">
                <LogoutButton />
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
  )

  return (
    <>
      {/* Hamburger trigger — larger tap area */}
      <button
        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors -ml-1"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mount the drawer overlay directly into the document body using a Portal */}
      {/* This prevents it from getting trapped in the header's z-index stacking context */}
      {mounted && createPortal(drawerContent, document.body)}
    </>
  )
}
