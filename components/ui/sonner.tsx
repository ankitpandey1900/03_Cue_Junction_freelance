"use client"

import { useTheme } from "@/components/shared/ThemeProvider"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheck, Info, AlertTriangle, XCircle, Loader2 } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheck className="size-4.5 text-emerald-500 shrink-0" />
        ),
        info: (
          <Info className="size-4.5 text-blue-500 shrink-0" />
        ),
        warning: (
          <AlertTriangle className="size-4.5 text-amber-500 shrink-0" />
        ),
        error: (
          <XCircle className="size-4.5 text-rose-500 shrink-0" />
        ),
        loading: (
          <Loader2 className="size-4.5 text-primary animate-spin shrink-0" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast: "group-[.toaster]:bg-card/80 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border-border/60 group-[.toaster]:shadow-2xl rounded-xl border px-4 py-3.5 flex gap-3 w-full font-sans antialiased text-xs md:text-sm font-medium",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[11px] font-normal leading-relaxed mt-0.5",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/90 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors",
          success: "group-[.toaster]:border-emerald-500/25 group-[.toaster]:bg-emerald-950/20 group-[.toaster]:text-emerald-400",
          error: "group-[.toaster]:border-rose-500/25 group-[.toaster]:bg-rose-950/20 group-[.toaster]:text-rose-400",
          warning: "group-[.toaster]:border-amber-500/25 group-[.toaster]:bg-amber-950/20 group-[.toaster]:text-amber-400",
          info: "group-[.toaster]:border-blue-500/25 group-[.toaster]:bg-blue-950/20 group-[.toaster]:text-blue-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
