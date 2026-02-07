"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Menu, X, LogOut, LayoutDashboard, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AynLogo } from "@/components/ayn-logo"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { NavLink, MagneticButton } from "./landing-utils"
import { cn } from "@/lib/utils"

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function LandingNavbar() {
  const { user, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const lastScrollY = useRef(0)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setHidden(true)
      } else {
        setHidden(false)
      }
      setScrolled(currentScrollY > 50)
      lastScrollY.current = currentScrollY
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const dialog = dialogRef.current
    if (!dialog) return
    const menuButton = menuButtonRef.current
    const focusable = dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    const list = Array.from(focusable)
    const first = list[0]
    if (first) requestAnimationFrame(() => first.focus())
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      const current = document.activeElement
      const idx = list.indexOf(current as HTMLElement)
      if (idx === -1) return
      if (e.shiftKey) {
        if (idx === 0) {
          e.preventDefault()
          list[list.length - 1].focus()
        }
      } else {
        if (idx === list.length - 1) {
          e.preventDefault()
          list[0].focus()
        }
      }
    }
    dialog.addEventListener("keydown", handleKeyDown)
    return () => {
      dialog.removeEventListener("keydown", handleKeyDown)
      menuButton?.focus()
    }
  }, [mobileOpen])

  const closeMobile = () => setMobileOpen(false)

  const handleLogout = async () => {
    await logout()
    window.location.href = "/"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? -100 : 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={cn(
          "flex items-center justify-between gap-6 px-4 py-2.5 rounded-full border transition-all duration-500",
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-border/50 shadow-lg shadow-black/10 dark:shadow-black/20"
            : "bg-background/50 backdrop-blur-md border-border/30"
        )}
        style={{ maxWidth: "720px", width: "100%" }}
      >
        <Link href="/" className="flex items-center shrink-0" aria-label="Ayn home">
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400 }}>
            <AynLogo size="sm" withGlow={false} heroStyle />
          </motion.div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#how-it-works">How it works</NavLink>
          <NavLink href="#about">About</NavLink>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <ThemeToggle />
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <div className="hidden md:block w-px h-5 bg-border/50" aria-hidden />

          {user ? (
            <>
              <MagneticButton
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-4 py-2 h-9 rounded-full hidden md:inline-flex font-medium"
              >
                <Link href="/platform/dashboard">Platform</Link>
              </MagneticButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hidden md:flex items-center gap-2 h-9 px-2 py-1.5 rounded-full hover:bg-accent/50 data-[state=open]:bg-accent/50"
                    aria-label="User menu"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-foreground"
                      aria-hidden
                    >
                      {getInitials(user.name)}
                    </span>
                    <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                      <p className="font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/platform/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      Go to Platform
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    className="cursor-pointer focus:bg-destructive/10 focus:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 px-2 py-1.5 hidden md:inline rounded-md hover:bg-accent/50"
              >
                Log in
              </Link>
              <MagneticButton
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-4 py-2 h-9 rounded-full hidden md:inline-flex font-medium"
              >
                <Link href="/signup">Sign in</Link>
              </MagneticButton>
            </>
          )}
        </div>
      </nav>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden top-20"
            aria-hidden
            onClick={closeMobile}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-label="Mobile menu"
            aria-modal="true"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed left-4 right-4 top-[72px] z-50 md:hidden rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-xl py-4 px-4"
          >
            <div className="flex flex-col gap-0">
              <NavLink href="#features" onClick={closeMobile}>
                Features
              </NavLink>
              <NavLink href="#how-it-works" onClick={closeMobile}>
                How it works
              </NavLink>
              <NavLink href="#about" onClick={closeMobile}>
                About
              </NavLink>
              <div className="border-t border-border my-3" />
              {user ? (
                <>
                  <div className="px-3 py-2 rounded-lg bg-muted/50 mb-2">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/platform/dashboard"
                    className="flex items-center gap-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 py-3 px-4 rounded-lg"
                    onClick={closeMobile}
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    Go to Platform
                  </Link>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 py-3 px-4 rounded-lg w-full text-left mt-1"
                    onClick={async () => {
                      closeMobile()
                      await handleLogout()
                    }}
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm text-muted-foreground hover:text-foreground py-3 px-4 rounded-lg hover:bg-accent block"
                    onClick={closeMobile}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 py-3 px-4 rounded-lg text-center block mt-1"
                    onClick={closeMobile}
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
