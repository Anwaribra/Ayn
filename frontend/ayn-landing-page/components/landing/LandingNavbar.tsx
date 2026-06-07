"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, LogOut, LayoutDashboard, ChevronDown, ArrowRight, Home, Sparkles, Calendar, Brain, HelpCircle, Layers, FileQuestion, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

export function LandingNavbar({
  onOpenDemo,
}: {
  onOpenDemo?: (type: "demo" | "pricing") => void
}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isOverDark, setIsOverDark] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("home")
  const isScrollingRef = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      let overDark = false
      setIsCompact(window.scrollY > 72)
      const headerCenterY = 32
      const darkSections = document.querySelectorAll('[data-section-theme="dark"]')

      darkSections.forEach((section) => {
        const rect = section.getBoundingClientRect()
        if (rect.top <= headerCenterY && rect.bottom >= headerCenterY) {
          overDark = true
        }
      })

      setIsOverDark(overDark)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  useEffect(() => {
    if (pathname !== "/") return

    const handleScrollSpy = () => {
      if (isScrollingRef.current) return

      if (window.scrollY < 100) {
        setActiveSection("home")
        return
      }

      const scrolledToBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120
      if (scrolledToBottom) {
        setActiveSection("faq")
        return
      }

      const sections = [
        { id: "main-content", key: "home" },
        { id: "horus-intelligence", key: "horus" },
        { id: "features", key: "features" },
        { id: "landing-faq", key: "faq" },
      ]

      let currentSection = "home"
      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          const absoluteTop = rect.top + window.scrollY
          if (window.scrollY + window.innerHeight / 2.5 >= absoluteTop) {
            currentSection = section.key
          }
        }
      }
      setActiveSection(currentSection)
    }

    handleScrollSpy()
    window.addEventListener("scroll", handleScrollSpy, { passive: true })
    return () => window.removeEventListener("scroll", handleScrollSpy)
  }, [pathname])

  const handleLogout = async () => { await logout(); window.location.href = "/" }

  const openDemo = () => {
    if (onOpenDemo) onOpenDemo("demo")
    else window.location.href = "/"
  }

  const scrollToSection = (id: string, key: string) => {
    setActiveSection(key)
    isScrollingRef.current = true

    if (pathname !== "/") {
      window.location.href = `/#${id}`
      return
    }

    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }

    setTimeout(() => {
      isScrollingRef.current = false
    }, 1000)
  }

  const demoBtnClass = (overDark: boolean) =>
    cn(
      "inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02]",
      overDark
        ? "border-white bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        : "border-black bg-black text-white hover:bg-[#0A0A0A] shadow-[0_4px_20px_rgba(0,0,0,0.14)]",
    )

  const faqNavHref = pathname === "/" ? "/#landing-faq" : "/faq/"

  const navItems = [
    { label: "Platform", href: "/#main-content" },
    { label: "Horus", href: "/#horus-intelligence" },
    { label: "Features", href: "/#features" },
    { label: "How", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "About", href: "/#about" },
    { label: "FAQ", href: faqNavHref },
  ]

  const rightSide = !user ? (
    <div className={cn("flex items-center gap-1.5", isCompact && "hidden")}>
      <Link
        href="/login"
        className={cn(
          "px-3 py-1.5 text-sm font-medium transition-colors duration-200 rounded-full hover:bg-black/5 dark:hover:bg-white/10",
          isOverDark ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"
        )}
      >
        Log in
      </Link>
      <button
        type="button"
        onClick={() => (onOpenDemo ? onOpenDemo("demo") : (window.location.href = "/"))}
        className={cn(demoBtnClass(isOverDark), "hidden md:inline-flex text-sm")}
      >
        Book Demo
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={cn("h-9 px-2 sm:px-3 rounded-full gap-1.5 sm:gap-2 transition-colors duration-300 cursor-pointer", isOverDark ? "hover:bg-white/10" : "hover:bg-black/5")}>
            <span className={cn("h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors duration-300", isOverDark ? "bg-white/10 text-white" : "bg-primary/10 text-primary")}>
              {getInitials(user.name)}
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-colors duration-300", isOverDark ? "text-white/60" : "text-black/50")} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52" sideOffset={10}>
          <DropdownMenuLabel className="font-normal">
            <p className="font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/platform/dashboard" className="flex items-center gap-2 cursor-pointer">
              <LayoutDashboard className="h-4 w-4" /> Go to Platform
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleLogout} className="cursor-pointer">
            <LogOut className="h-4 w-4" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Link
        href="/platform/dashboard"
        className={cn(
          "hidden md:inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02]",
          isOverDark
            ? "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            : "bg-[#0A0A0A] text-white hover:bg-black shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
        )}
      >
        Platform
      </Link>
    </div>
  )

  const labels = {
    home: "Home",
    features: "Features",
    demo: "Book Demo",
    horus: "Horus AI",
    search: "FAQ",
  }

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-0 left-0 right-0 z-50 px-5 pt-4 pb-4 bg-transparent pointer-events-none"
      >
        <motion.div
          layout
          className={cn(
            "max-w-6xl mx-auto flex items-center gap-4 pointer-events-auto",
            isCompact ? "justify-center" : "justify-between",
          )}
        >
          {/* ── Logo ── */}
          <AnimatePresence initial={false} mode="popLayout">
            {!isCompact ? (
              <motion.div
                key="landing-logo"
                initial={{ opacity: 0, x: -14, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -18, scale: 0.96, filter: "blur(6px)" }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="shrink-0 z-50"
              >
                <Link href="/" aria-label="Ayn home" className="group block">
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="flex items-center select-none"
                  >
                    <span
                      className={cn(
                        "text-[1.6rem] font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r",
                        isOverDark
                          ? "from-white via-white/90 to-primary"
                          : "from-black via-black/90 to-primary drop-shadow-sm",
                      )}
                    >
                      Ayn
                    </span>
                  </motion.div>
                </Link>
              </motion.div>
            ) : (
              <div key="landing-logo-mobile" className="md:hidden shrink-0 z-50">
                <Link href="/" aria-label="Ayn home" className="group block">
                  <div className="flex items-center select-none">
                    <span
                      className={cn(
                        "text-[1.6rem] font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r",
                        isOverDark
                          ? "from-white via-white/90 to-primary"
                          : "from-black via-black/90 to-primary drop-shadow-sm",
                      )}
                    >
                      Ayn
                    </span>
                  </div>
                </Link>
              </div>
            )}
          </AnimatePresence>

          {/* ── Desktop Nav Pill ── */}
          <nav
            className={cn(
              "hidden md:flex items-center justify-center gap-0.5 rounded-full border py-1.5 backdrop-blur-xl transition-all duration-500",
              isCompact ? "px-3" : "px-2",
              isOverDark
                ? "border-white/10 bg-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                : "border-black/[0.04] bg-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
            )}
          >
            {navItems.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  "whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                  isOverDark
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-black/60 hover:text-black hover:bg-black/5"
                )}
              >
                {label}
              </Link>
            ))}

            {/* Compact items appear inside nav when scrolled */}
            <AnimatePresence initial={false}>
              {isCompact && !user && (
                <motion.div
                  key="compact-logged-out"
                  initial={{ opacity: 0, x: 18, scale: 0.94 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 18, scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  className="ml-1.5 flex items-center gap-1.5 pl-1.5"
                >
                  <span
                    className={cn("h-5 w-px", isOverDark ? "bg-white/10" : "bg-black/8")}
                    aria-hidden
                  />
                  <Link
                    href="/login"
                    className={cn(
                      "px-2.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                      isOverDark
                        ? "text-white/70 hover:text-white hover:bg-white/10"
                        : "text-black/60 hover:text-black hover:bg-black/5"
                    )}
                  >
                    Log in
                  </Link>
                  <button
                    type="button"
                    onClick={() => (onOpenDemo ? onOpenDemo("demo") : (window.location.href = "/"))}
                    className={cn(demoBtnClass(isOverDark), "px-4 py-1.5 text-sm")}
                  >
                    Book Demo
                  </button>
                </motion.div>
              )}

              {isCompact && user && (
                <motion.div
                  key="compact-logged-in"
                  initial={{ opacity: 0, x: 18, scale: 0.94 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 18, scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  className="ml-1.5 flex items-center gap-1.5 pl-1.5"
                >
                  <span
                    className={cn("h-5 w-px", isOverDark ? "bg-white/10" : "bg-black/8")}
                    aria-hidden
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={cn("h-8 px-2 rounded-full gap-1.5 transition-colors duration-300 cursor-pointer", isOverDark ? "hover:bg-white/10" : "hover:bg-black/5")}>
                        <span className={cn("h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors duration-300", isOverDark ? "bg-white/10 text-white" : "bg-primary/10 text-primary")}>
                          {getInitials(user.name)}
                        </span>
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-colors duration-300", isOverDark ? "text-white/60" : "text-black/50")} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52" sideOffset={10}>
                      <DropdownMenuLabel className="font-normal">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/platform/dashboard" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="h-4 w-4" /> Go to Platform
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={handleLogout} className="cursor-pointer">
                        <LogOut className="h-4 w-4" /> Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Link
                    href="/platform/dashboard"
                    className={cn(
                      "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02]",
                      isOverDark
                        ? "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                        : "bg-[#0A0A0A] text-white hover:bg-black shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
                    )}
                  >
                    Platform
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>

          {/* ── Right Side (outside nav, hidden when compact) ── */}
          <AnimatePresence initial={false} mode="popLayout">
            {!isCompact && (
              <motion.div
                key="right-side"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 18, scale: 0.96, filter: "blur(6px)" }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="shrink-0"
              >
                {rightSide}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.header>

      {/* Floating bottom navigation dock for mobile */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] md:hidden flex items-center pointer-events-auto select-none">
        <div className="px-3 py-2 flex items-center gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-black/8 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-xl rounded-full">
          <BottomTab
            icon={Home}
            label={labels.home}
            active={activeSection === "home"}
            onClick={() => scrollToSection("main-content", "home")}
          />
          <BottomTab
            icon={Brain}
            label={labels.horus}
            active={activeSection === "horus"}
            onClick={() => scrollToSection("horus-intelligence", "horus")}
          />
          <BottomTab
            icon={Layers}
            label={labels.features}
            active={activeSection === "features"}
            onClick={() => scrollToSection("features", "features")}
          />
          <BottomTab
            icon={FileQuestion}
            label={labels.search}
            active={activeSection === "faq"}
            onClick={() => scrollToSection("landing-faq", "faq")}
          />
          <div className="w-px h-8 bg-black/10 dark:bg-white/10 mx-1" aria-hidden />
          <DemoButton
            label={labels.demo}
            onClick={() => openDemo()}
          />
        </div>
      </div>
    </>
  )
}

const BottomTab = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any
  label: string
  active: boolean
  onClick: () => void
}) => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative flex flex-col items-center justify-center shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setTimeout(() => setHovered(false), 800)}
    >
      <button
        onClick={onClick}
        type="button"
        className={cn(
          "transition-all duration-300 flex items-center justify-center relative cursor-pointer outline-none select-none shrink-0",
          active
            ? "w-10 h-10 text-primary bg-primary/10 dark:bg-primary/20 scale-110"
            : "w-10 h-10 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 active:scale-90"
        )}
        style={{ WebkitTapHighlightColor: "transparent", borderRadius: "9999px" }}
      >
        <Icon className="w-5 h-5" />
        {active && (
          <motion.span
            layoutId="activeDot"
            className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </button>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: -45, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute z-[110] px-2.5 py-1.5 text-[11px] font-semibold text-white bg-zinc-900 dark:bg-zinc-800 rounded-lg shadow-lg whitespace-nowrap pointer-events-none border border-white/10"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const DemoButton = ({ label, onClick }: { label: string; onClick: () => void }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative flex flex-col items-center justify-center shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setTimeout(() => setHovered(false), 800)}
    >
      <button
        onClick={onClick}
        type="button"
        className="w-10 h-10 flex items-center justify-center bg-primary text-white shadow-[0_4px_12px_rgba(59,111,217,0.35)] active:scale-95 transition-all cursor-pointer outline-none select-none shrink-0"
        style={{ WebkitTapHighlightColor: "transparent", borderRadius: "9999px" }}
      >
        <CalendarDays className="w-5 h-5" />
      </button>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: -45, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute z-[110] px-2.5 py-1.5 text-[11px] font-semibold text-white bg-zinc-900 dark:bg-zinc-800 rounded-lg shadow-lg whitespace-nowrap pointer-events-none border border-white/10"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
