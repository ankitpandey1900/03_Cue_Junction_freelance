"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useState } from "react"

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await authClient.signOut()
      router.push("/login")
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={loading}
      className="flex-1 justify-center gap-2 bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      <span className="truncate">{loading ? "Signing out…" : "Sign Out"}</span>
    </Button>
  )
}
