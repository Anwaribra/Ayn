"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Command,
  Sparkles,
  Clock,
  ArrowRight,
  CornerDownLeft,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command as CommandType,
  allCommands,
  filterCommands,
  groupCommandsByCategory,
  getRecentCommands,
  saveRecentCommand,
} from "@/lib/commands"
import { useCommandPaletteContext } from "./command-palette-provider"

// ─── Components ─────────────────────────────────────────────────────────────

function CommandBadge({
  children,
  variant = "default",
}: {
  children: React.ReactNode
  variant?: "ai" | "new" | "beta" | "default"
}) {
  const variants = {
    ai: "bg-[var(--brand)]/10 text-[var(--brand)] border-[var(--brand)]/20",
    new: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    beta: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    default: "bg-muted text-muted-foreground border-border",
  }

  return (
    <span
      className={cn(
        "px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border",
        variants[variant]
      )}
    >
      {children}
    </span>
  )
}

function CommandItem({
  command,
  isSelected,
  onSelect,
  onHighlight,
  showShortcut = true,
}: {
  command: CommandType
  isSelected: boolean
  onSelect: () => void
  onHighlight?: () => void
  showShortcut?: boolean
}) {
  const Icon = command.icon

  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHighlight}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150",
        "hover:bg-accent/50 focus:bg-accent/50 focus:outline-none",
        isSelected && "bg-accent/80"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
          command.category === "AI & Assistance"
            ? "bg-[var(--brand)]/10 text-[var(--brand)]"
            : "bg-muted text-muted-foreground",
          isSelected &&
          command.category === "AI & Assistance" &&
          "bg-[var(--brand)]/20 text-[var(--brand)]"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground truncate">
            {command.title}
          </span>
          {command.badge && (
            <CommandBadge
              variant={
                command.badge.toLowerCase() as "ai" | "new" | "beta" | "default"
              }
            >
              {command.badge}
            </CommandBadge>
          )}
        </div>
        {command.description && (
          <p className="text-xs text-muted-foreground truncate">
            {command.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {showShortcut && command.shortcut && (
          <kbd className="hidden sm:flex h-6 items-center gap-0.5 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            {command.shortcut.split("").map((key, i) => (
              <span key={i}>{key}</span>
            ))}
          </kbd>
        )}
        {isSelected && (
          <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
        )}
      </div>
    </button>
  )
}

function CommandGroup({
  title,
  children,
  icon: Icon,
}: {
  title: string
  children: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="py-2">
      <div className="px-4 py-1.5 flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
        <Search className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium text-foreground">
        No results for &quot;{query}&quot;
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Try a different search term or browse categories
      </p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CommandPalette() {
  const router = useRouter()
  const { open, setOpen } = useCommandPaletteContext()
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Filter commands based on query
  const filteredCommands = useMemo(
    () => filterCommands(allCommands, query),
    [query]
  )

  // Get recent commands
  const recentCommandIds = useMemo(() => getRecentCommands(), [open])
  const recentCommands = useMemo(
    () =>
      recentCommandIds
        .map((id) => allCommands.find((cmd) => cmd.id === id))
        .filter(Boolean) as CommandType[],
    [recentCommandIds]
  )

  // Group commands for display
  const groupedCommands = useMemo(
    () => groupCommandsByCategory(filteredCommands),
    [filteredCommands]
  )

  // Flatten for keyboard navigation
  const flatCommands = useMemo(
    () =>
      query
        ? filteredCommands
        : [
          ...recentCommands,
          ...allCommands.filter((cmd) => !recentCommandIds.includes(cmd.id)),
        ],
    [query, filteredCommands, recentCommands, recentCommandIds]
  )

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      setQuery("")
      setSelectedIndex(0)
    }
  }, [open])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < flatCommands.length - 1 ? prev + 1 : prev
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          break
        case "Enter":
          e.preventDefault()
          const selected = flatCommands[selectedIndex]
          if (selected) {
            executeCommand(selected)
          }
          break
        case "Escape":
          e.preventDefault()
          setOpen(false)
          break
      }
    },
    [open, flatCommands, selectedIndex, setOpen]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      )
      selectedElement?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [selectedIndex])

  // Execute command
  const executeCommand = useCallback(
    (command: CommandType) => {
      saveRecentCommand(command.id)

      if (command.action) {
        command.action()
      }

      if (command.href) {
        router.push(command.href)
      }

      setOpen(false)
      setQuery("")
    },
    [router, setOpen]
  )

  // Render commands list
  const renderCommandsList = () => {
    if (query) {
      if (filteredCommands.length === 0) {
        return <EmptyState query={query} />
      }

      return (
        <div className="py-2">
          {filteredCommands.map((command, index) => (
            <div key={command.id} data-index={index}>
              <CommandItem
                command={command}
                isSelected={selectedIndex === index}
                onSelect={() => executeCommand(command)}
                onHighlight={() => setSelectedIndex(index)}
              />
            </div>
          ))}
        </div>
      )
    }

    // Default view - grouped by category
    let currentIndex = 0

    return (
      <div ref={listRef} className="overflow-y-auto max-h-[400px]">
        {/* Recent commands */}
        {recentCommands.length > 0 && (
          <CommandGroup title="Recent" icon={Clock}>
            {recentCommands.map((command) => {
              const index = currentIndex++
              return (
                <div key={command.id} data-index={index}>
                  <CommandItem
                    command={command}
                    isSelected={selectedIndex === index}
                    onSelect={() => executeCommand(command)}
                    onHighlight={() => setSelectedIndex(index)}
                  />
                </div>
              )
            })}
          </CommandGroup>
        )}

        {/* AI & Assistance */}
        {groupedCommands["AI & Assistance"] && (
          <CommandGroup title="AI & Assistance" icon={Sparkles}>
            {groupedCommands["AI & Assistance"].map((command) => {
              const index = currentIndex++
              return (
                <div key={command.id} data-index={index}>
                  <CommandItem
                    command={command}
                    isSelected={selectedIndex === index}
                    onSelect={() => executeCommand(command)}
                    onHighlight={() => setSelectedIndex(index)}
                  />
                </div>
              )
            })}
          </CommandGroup>
        )}

        {/* Quick Create */}
        {groupedCommands["Quick Create"] && (
          <CommandGroup title="Quick Create">
            {groupedCommands["Quick Create"].map((command) => {
              const index = currentIndex++
              return (
                <div key={command.id} data-index={index}>
                  <CommandItem
                    command={command}
                    isSelected={selectedIndex === index}
                    onSelect={() => executeCommand(command)}
                    onHighlight={() => setSelectedIndex(index)}
                  />
                </div>
              )
            })}
          </CommandGroup>
        )}

        {/* Navigation */}
        {groupedCommands["Navigation"] && (
          <CommandGroup title="Navigation">
            {groupedCommands["Navigation"].map((command) => {
              const index = currentIndex++
              return (
                <div key={command.id} data-index={index}>
                  <CommandItem
                    command={command}
                    isSelected={selectedIndex === index}
                    onSelect={() => executeCommand(command)}
                    onHighlight={() => setSelectedIndex(index)}
                  />
                </div>
              )
            })}
          </CommandGroup>
        )}

        {/* Actions */}
        {groupedCommands["Actions"] && (
          <CommandGroup title="Actions">
            {groupedCommands["Actions"].map((command) => {
              const index = currentIndex++
              return (
                <div key={command.id} data-index={index}>
                  <CommandItem
                    command={command}
                    isSelected={selectedIndex === index}
                    onSelect={() => executeCommand(command)}
                    onHighlight={() => setSelectedIndex(index)}
                  />
                </div>
              )
            })}
          </CommandGroup>
        )}

        {/* Preferences & Help */}
        {(groupedCommands["Preferences"] || groupedCommands["Help"]) && (
          <CommandGroup title="Other">
            {[
              ...(groupedCommands["Preferences"] || []),
              ...(groupedCommands["Help"] || []),
            ].map((command) => {
              const index = currentIndex++
              return (
                <div key={command.id} data-index={index}>
                  <CommandItem
                    command={command}
                    isSelected={selectedIndex === index}
                    onSelect={() => executeCommand(command)}
                    onHighlight={() => setSelectedIndex(index)}
                    showShortcut={false}
                  />
                </div>
              )
            })}
          </CommandGroup>
        )}
      </div>
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[15%] z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-background/95 shadow-2xl backdrop-blur-xl">
              {/* Search Header */}
              <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands, pages, or ask Horus AI..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <kbd className="hidden sm:flex h-7 items-center gap-0.5 rounded border border-border bg-muted px-2 text-[11px] font-medium text-muted-foreground">
                  <Command className="h-3 w-3" />
                  <span>K</span>
                </kbd>
              </div>

              {/* Commands List */}
              <div className="max-h-[60vh] overflow-y-auto">
                {renderCommandsList()}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5 bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      to select
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CornerDownLeft className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      to run
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {flatCommands.length} commands
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Trigger Button for Header ──────────────────────────────────────────────

export function CommandPaletteTrigger() {
  const { toggle } = useCommandPaletteContext()

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-1.5",
        "text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground",
        "focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50"
      )}
    >
      <Search className="h-4 w-4" />
      <span className="hidden lg:inline">Search...</span>
      <kbd className="hidden lg:flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 text-[10px] font-medium">
        <Command className="h-2.5 w-2.5" />
        <span>K</span>
      </kbd>
    </button>
  )
}
