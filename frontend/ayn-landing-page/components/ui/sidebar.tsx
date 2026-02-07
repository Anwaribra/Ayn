"use client"

import { cn } from "@/lib/utils"
import Link, { LinkProps } from "next/link"
import React, { useState, createContext, useContext } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X } from "lucide-react"

/* ---------------- Context ---------------- */
export interface SidebarLinkItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface SidebarContextProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  animate: boolean
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) throw new Error("useSidebar must be used within Sidebar")
  return context
}

/* ---------------- Provider ---------------- */
export function SidebarProvider({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) {
  const [internalOpen, setInternalOpen] = useState(true)

  const open = openProp ?? internalOpen
  const setOpen = setOpenProp ?? setInternalOpen

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  )
}

/* ---------------- Root ---------------- */
export function Sidebar({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  )
}

/* ---------------- Body ---------------- */
export function SidebarBody(props: React.ComponentProps<typeof motion.div>) {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar>{props.children}</MobileSidebar>
    </>
  )
}

/* ---------------- Desktop ---------------- */
export function DesktopSidebar({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) {
  const { open, animate } = useSidebar()

  return (
    <motion.div
      className={cn(
        "hidden md:flex flex-col h-screen min-h-0 bg-sidebar border-r border-sidebar-border flex-shrink-0",
        className
      )}
      animate={animate ? { width: open ? 280 : 72 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/* ---------------- Mobile ---------------- */
export function MobileSidebar({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useSidebar()

  return (
    <div className="md:hidden">
      {/* Mobile Top Bar */}
      <div className="h-14 flex items-center justify-end px-4 border-b bg-sidebar">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              className="fixed left-0 top-0 h-screen w-[280px] bg-sidebar z-50 flex flex-col"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <button
                className="absolute right-3 top-3"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
              {children}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------------- Link ---------------- */
export function SidebarLink({
  link,
  isActive,
  onClick,
  className,
  ...props
}: {
  link: SidebarLinkItem
  isActive?: boolean
  onClick?: () => void
  className?: string
} & Omit<LinkProps, "href">) {
  const { open, animate } = useSidebar()

  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-foreground font-medium"
          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        className
      )}
      {...props}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r" />
      )}

      <span className="[&_svg]:size-5 shrink-0">{link.icon}</span>

      <motion.span
        animate={{
          opacity: animate ? (open ? 1 : 0) : 1,
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
        }}
        className="text-sm whitespace-nowrap"
      >
        {link.label}
      </motion.span>
    </Link>
  )
}
