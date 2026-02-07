"use client"

import { cn } from "@/lib/utils"
import Link, { LinkProps } from "next/link"
import React, { useState, createContext, useContext } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X } from "lucide-react"

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
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

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
  const [openState, setOpenState] = useState(false)
  const open = openProp !== undefined ? openProp : openState
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState
  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  )
}

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

export function SidebarBody(props: React.ComponentProps<typeof motion.div>) {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  )
}

export function DesktopSidebar({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) {
  const { open, setOpen, animate } = useSidebar()
  return (
    <motion.div
      className={cn(
        "h-full hidden md:flex md:flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0 shadow-sm",
        "px-3 py-4",
        !animate && "w-[280px]",
        className
      )}
      animate={animate ? { width: open ? "280px" : "72px" } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseEnter={animate ? () => setOpen(true) : undefined}
      onMouseLeave={animate ? () => setOpen(false) : undefined}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function MobileSidebar({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { open, setOpen } = useSidebar()
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-sidebar border-b border-sidebar-border w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <button
            type="button"
            className="text-sidebar-foreground cursor-pointer p-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[99] md:hidden"
                onClick={() => setOpen(false)}
                aria-hidden
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                  "fixed h-full w-full max-w-sm inset-y-0 left-0 bg-sidebar border-r border-sidebar-border p-6 pt-14 z-[100] flex flex-col shadow-xl",
                  className
                )}
              >
                <button
                type="button"
                className="absolute right-10 top-10 z-50 text-foreground cursor-pointer p-2"
                onClick={() => setOpen(!open)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
              {children}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

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
        "relative flex items-center justify-start gap-3 group/sidebar py-2.5 px-3 rounded-lg transition-all duration-200",
        isActive
          ? "bg-sidebar-accent text-sidebar-foreground font-medium"
          : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
        className
      )}
      {...props}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-primary"
          aria-hidden
        />
      )}
      <span className="flex shrink-0 [&_svg]:size-5">{link.icon}</span>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  )
}
