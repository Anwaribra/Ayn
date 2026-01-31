"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
    theme: Theme
    resolvedTheme: "light" | "dark"
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
    mounted: boolean
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "dark",
    resolvedTheme: "dark",
    setTheme: () => { },
    toggleTheme: () => { },
    mounted: false,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark")
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark")
    const [mounted, setMounted] = useState(false)

    // Get system theme preference
    const getSystemTheme = useCallback((): "light" | "dark" => {
        if (typeof window === "undefined") return "dark"
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }, [])

    // Resolve the actual theme (handles "system" option)
    const resolveTheme = useCallback((themeValue: Theme): "light" | "dark" => {
        if (themeValue === "system") {
            return getSystemTheme()
        }
        return themeValue
    }, [getSystemTheme])

    // Apply the theme to the document
    const applyTheme = useCallback((resolved: "light" | "dark") => {
        const root = document.documentElement
        if (resolved === "dark") {
            root.classList.add("dark")
            root.classList.remove("light")
        } else {
            root.classList.add("light")
            root.classList.remove("dark")
        }
        // Also set a meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]')
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", resolved === "dark" ? "#000000" : "#ffffff")
        }
    }, [])

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const storedTheme = localStorage.getItem("ayn-theme") as Theme | null
        const initialTheme = storedTheme || "dark"
        setThemeState(initialTheme)
        const resolved = resolveTheme(initialTheme)
        setResolvedTheme(resolved)
        applyTheme(resolved)
        setMounted(true)
    }, [resolveTheme, applyTheme])

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== "system") return

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        const handleChange = () => {
            const resolved = resolveTheme("system")
            setResolvedTheme(resolved)
            applyTheme(resolved)
        }

        mediaQuery.addEventListener("change", handleChange)
        return () => mediaQuery.removeEventListener("change", handleChange)
    }, [theme, resolveTheme, applyTheme])

    // Update theme
    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme)
        localStorage.setItem("ayn-theme", newTheme)
        const resolved = resolveTheme(newTheme)
        setResolvedTheme(resolved)
        applyTheme(resolved)
    }, [resolveTheme, applyTheme])

    // Toggle between light and dark
    const toggleTheme = useCallback(() => {
        const newTheme = resolvedTheme === "dark" ? "light" : "dark"
        setTheme(newTheme)
    }, [resolvedTheme, setTheme])

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    return useContext(ThemeContext)
}

