"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

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

  return (
    <NextThemesProvider
      {...props}
      storageKey="theme-preference"
      enableSystem
      defaultTheme="system"
      disableTransitionOnChange
    >
      <ThemeWatcher />
      {children}
    </NextThemesProvider>
  )
}

