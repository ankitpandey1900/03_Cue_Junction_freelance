"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"

type Theme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: Theme
  setTheme: Dispatch<SetStateAction<string>>
  themes: Theme[]
}

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
  disableTransitionOnChange?: boolean
}

const themes: Theme[] = ["light", "dark"]
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark"
}

function applyTheme(theme: Theme, disableTransitionOnChange: boolean) {
  const root = document.documentElement
  const cleanup = disableTransitionOnChange ? disableTransitions() : undefined

  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme

  cleanup?.()
}

function disableTransitions() {
  const style = document.createElement("style")
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{transition:none!important;animation:none!important}"
    )
  )
  document.head.appendChild(style)

  return () => {
    window.getComputedStyle(document.body)
    window.setTimeout(() => {
      style.remove()
    }, 1)
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "theme",
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme
    }

    const storedTheme = window.localStorage.getItem(storageKey)
    return isTheme(storedTheme) ? storedTheme : defaultTheme
  })

  useEffect(() => {
    applyTheme(theme, false)
  }, [theme])

  const setTheme = useCallback<Dispatch<SetStateAction<string>>>(
    (value) => {
      setThemeState((currentTheme) => {
        const nextValue = typeof value === "function" ? value(currentTheme) : value
        const nextTheme = isTheme(nextValue) ? nextValue : defaultTheme

        window.localStorage.setItem(storageKey, nextTheme)
        applyTheme(nextTheme, disableTransitionOnChange)

        return nextTheme
      })
    },
    [defaultTheme, disableTransitionOnChange, storageKey]
  )

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: theme,
      setTheme,
      themes,
    }),
    [setTheme, theme]
  )

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }

  return context
}
