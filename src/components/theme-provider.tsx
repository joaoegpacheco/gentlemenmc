"use client"

import * as React from "react"
import { Theme } from "@radix-ui/themes"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

function RadixTheme({ children }: { children: React.ReactNode }) {
  return (
    <Theme
      accentColor="gold"
      grayColor="gray"
      panelBackground="translucent"
      radius="medium"
      appearance="inherit"
    >
      {children}
    </Theme>
  )
}

function ThemeWatcher() {
  const { theme } = useTheme()
  
  React.useEffect(() => {
    // Se o tema for "system", remove do localStorage para sempre usar o padrão
    if (theme === 'system' && typeof window !== 'undefined') {
      const checkAndRemove = () => {
        const saved = localStorage.getItem('theme-preference')
        if (saved === 'system') {
          localStorage.removeItem('theme-preference')
        }
      }
      // Verifica imediatamente e depois de um pequeno delay
      checkAndRemove()
      const timeout = setTimeout(checkAndRemove, 100)
      return () => clearTimeout(timeout)
    }
  }, [theme])
  
  return null
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  // Remove "system" do localStorage na inicialização
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme-preference')
      if (savedTheme === 'system') {
        localStorage.removeItem('theme-preference')
      }
    }
  }, [])

  // next-themes injects an inline <script> to prevent theme flash on SSR.
  // Next.js 16 warns when that script is re-rendered on the client — use
  // type="application/json" so React skips it without affecting SSR execution.
  const scriptProps =
    typeof window !== "undefined"
      ? ({ type: "application/json" } as const)
      : undefined

  return (
    <NextThemesProvider
      {...props}
      storageKey="theme-preference"
      enableSystem
      defaultTheme="system"
      disableTransitionOnChange
      scriptProps={scriptProps}
    >
      <RadixTheme>
        <ThemeWatcher />
        {children}
      </RadixTheme>
    </NextThemesProvider>
  )
}

