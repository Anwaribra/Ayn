"use client"

import { useTheme } from "@/lib/theme-context"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
    className?: string
    showLabel?: boolean
    variant?: "icon" | "pill" | "dropdown"
}

export function ThemeToggle({ className, showLabel = false, variant = "icon" }: ThemeToggleProps) {
    const { theme, resolvedTheme, setTheme, toggleTheme, mounted } = useTheme()

    // Show a placeholder while not mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <div className={cn("p-2 rounded-full bg-muted/50 animate-pulse", className)}>
                <div className="w-[18px] h-[18px]" />
            </div>
        )
    }

    // Simple icon toggle (default)
    if (variant === "icon") {
        return (
            <motion.button
                onClick={toggleTheme}
                className={cn(
                    "relative p-2.5 rounded-full transition-all duration-300",
                    "bg-muted hover:bg-muted/80",
                    "text-foreground",
                    "border border-border hover:border-primary/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    className
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={resolvedTheme}
                        initial={{ y: -20, opacity: 0, rotate: -90 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: 20, opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        {resolvedTheme === "dark" ? (
                            <Moon size={16} className="text-foreground" />
                        ) : (
                            <Sun size={16} className="text-foreground" />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Subtle glow effect */}
                <motion.div
                    className="absolute inset-0 rounded-full opacity-0 bg-primary/20"
                    animate={{
                        opacity: [0, 0.2, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "loop",
                    }}
                />
            </motion.button>
        )
    }

    // Pill toggle with all three options
    if (variant === "pill") {
        const options = [
            { value: "light" as const, icon: Sun, label: "Light" },
            { value: "dark" as const, icon: Moon, label: "Dark" },
            { value: "system" as const, icon: Monitor, label: "System" },
        ]

        return (
            <div
                className={cn(
                    "flex items-center gap-1 p-1 rounded-full",
                    "bg-zinc-800/50 dark:bg-zinc-800/50 light:bg-zinc-200/80",
                    "border border-zinc-700/50 dark:border-zinc-700/50 light:border-zinc-300/50",
                    className
                )}
            >
                {options.map((option) => {
                    const isActive = theme === option.value
                    const Icon = option.icon

                    return (
                        <motion.button
                            key={option.value}
                            onClick={() => setTheme(option.value)}
                            className={cn(
                                "relative px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-zinc-500/50",
                                isActive
                                    ? "text-zinc-100 dark:text-zinc-100 light:text-zinc-900"
                                    : "text-zinc-500 hover:text-zinc-300 dark:text-zinc-500 dark:hover:text-zinc-300 light:text-zinc-500 light:hover:text-zinc-700"
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            aria-label={`Switch to ${option.label} mode`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="theme-pill-bg"
                                    className={cn(
                                        "absolute inset-0 rounded-full",
                                        "bg-zinc-700 dark:bg-zinc-700 light:bg-white",
                                        "shadow-lg"
                                    )}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5">
                                <Icon size={14} />
                                {showLabel && option.label}
                            </span>
                        </motion.button>
                    )
                })}
            </div>
        )
    }

    // Dropdown variant
    return (
        <div className={cn("relative group", className)}>
            <motion.button
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300",
                    "bg-zinc-800/50 hover:bg-zinc-700/50 dark:bg-zinc-800/50 dark:hover:bg-zinc-700/50",
                    "light:bg-zinc-200/80 light:hover:bg-zinc-300/80",
                    "text-zinc-400 hover:text-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100",
                    "light:text-zinc-600 light:hover:text-zinc-900",
                    "border border-zinc-700/50 dark:border-zinc-700/50 light:border-zinc-300/50"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Theme options"
            >
                {resolvedTheme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
                {showLabel && (
                    <span className="text-sm font-medium capitalize">{theme}</span>
                )}
            </motion.button>

            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "py-2 rounded-lg shadow-xl",
                        "bg-zinc-900 dark:bg-zinc-900 light:bg-white",
                        "border border-zinc-800 dark:border-zinc-800 light:border-zinc-200"
                    )}
                >
                    {[
                        { value: "light" as const, icon: Sun, label: "Light" },
                        { value: "dark" as const, icon: Moon, label: "Dark" },
                        { value: "system" as const, icon: Monitor, label: "System" },
                    ].map((option) => {
                        const Icon = option.icon
                        const isActive = theme === option.value

                        return (
                            <button
                                key={option.value}
                                onClick={() => setTheme(option.value)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                                    isActive
                                        ? "text-zinc-100 bg-zinc-800/50 dark:text-zinc-100 dark:bg-zinc-800/50 light:text-zinc-900 light:bg-zinc-100"
                                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/30 dark:text-zinc-400 dark:hover:text-zinc-100 light:text-zinc-600 light:hover:text-zinc-900 light:hover:bg-zinc-100"
                                )}
                            >
                                <Icon size={16} />
                                {option.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="theme-check"
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                                    />
                                )}
                            </button>
                        )
                    })}
                </motion.div>
            </div>
        </div>
    )
}
