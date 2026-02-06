"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AynLogo } from "@/components/ayn-logo"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { NavLink, MagneticButton } from "./landing-utils"

export function LandingNavbar() {
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
      menuButtonRef.current?.focus()
    }
  }, [mobileOpen])

  const closeMobile = () => setMobileOpen(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? -100 : 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={`
          flex items-center justify-between gap-8 px-4 py-2.5 
          rounded-full border transition-all duration-500
          ${scrolled
            ? "bg-background/80 backdrop-blur-xl border-border/50 shadow-lg shadow-black/10 dark:shadow-black/20"
            : "bg-background/50 backdrop-blur-md border-border/30"
          }
        `}
        style={{ maxWidth: "720px", width: "100%" }}
      >
        <Link href="/" className="flex items-center">
          <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 400 }}>
            <AynLogo size="sm" withGlow={false} heroStyle />
          </motion.div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#how-it-works">How it works</NavLink>
          <NavLink href="#about">About</NavLink>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="w-px h-4 bg-border/50 hidden md:block" />
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 px-2 py-1.5 hidden md:inline"
          >
            Log in
          </Link>
          <MagneticButton
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-4 py-1.5 h-auto rounded-full hidden md:inline-flex"
          >
            <Link href="/signup">Sign in</Link>
          </MagneticButton>
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
            className="fixed left-4 right-4 top-[72px] z-50 md:hidden rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-xl py-4 px-4 [&_a]:block [&_a]:py-3 [&_a]:px-3 [&_a]:rounded-lg [&_a]:hover:bg-accent"
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
              <div className="border-t border-border my-2" />
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded-lg hover:bg-accent"
                onClick={closeMobile}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 py-2 px-4 rounded-lg text-center"
                onClick={closeMobile}
              >
                Sign in
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
