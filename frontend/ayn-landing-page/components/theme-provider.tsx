"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

import { usePathname } from "next/navigation"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    const pathname = usePathname()
    // Force light mode on all pages except the platform dashboard
    const forceLightMode = pathname ? !pathname.startsWith('/platform') : false

    return (
        <NextThemesProvider
            {...props}
            forcedTheme={forceLightMode ? 'light' : undefined}
        >
            {children}
        </NextThemesProvider>
    )
}
