"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, LogOut, LogIn, LayoutDashboard, ChevronDown, ArrowRight, Home, Sparkles, Calendar, Brain, HelpCircle, Layers, CalendarDays, CreditCard, Workflow } from "lucide-react"
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
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/#about" },
    { label: "FAQ", href: faqNavHref },
  ]

  const rightSide = !user ? (
    <div className="flex items-center gap-1.5">
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
    how: "How",
  }

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
      >
        <motion.div
          layout
          className={cn(
            "pointer-events-auto relative flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isCompact 
              ? "max-w-[900px] w-full p-1.5 pl-6 pr-1.5 rounded-full" 
              : "max-w-5xl w-full p-2.5 pl-8 pr-2.5 rounded-[1.5rem]",
            isOverDark
              ? "bg-white/[0.04] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl"
              : "bg-black/[0.03] border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl"
          )}
        >
          {/* ── Logo (Left) ── */}
          <div className="flex shrink-0 z-50">
            <Link href="/" aria-label="Ayn home" className="group block">
              <div className="flex items-center select-none">
                <span
                  className={cn(
                    "text-[1.45rem] font-bold tracking-tight",
                    isOverDark
                      ? "text-white"
                      : "text-black"
                  )}
                >
                  Ayn
                </span>
              </div>
            </Link>
          </div>

          {/* ── Desktop Nav Links (flex center between logo and buttons) ── */}
          <div className="hidden lg:flex flex-1 justify-center min-w-0">
            <nav
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-full px-2 py-1 transition-all duration-500",
                isOverDark
                  ? "bg-white/[0.06] border border-white/[0.08]"
                  : "bg-black/[0.04] border border-black/[0.06]"
              )}
            >
              {navItems.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "whitespace-nowrap px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-300",
                    isOverDark
                      ? "text-white/80 hover:text-white"
                      : "text-black/80 hover:text-black"
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* ── Right Side (Buttons) ── */}
          <div className="flex shrink-0 z-50 ml-4">
            {rightSide}
          </div>
        </motion.div>
      </motion.header>

      {/* Floating bottom navigation dock for mobile */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] md:hidden flex items-center pointer-events-auto select-none">
        <div className="px-3 py-2 flex items-center gap-2 shadow-[0_16px_32px_rgba(0,0,0,0.5)] border border-white/[0.08] bg-[#050505]/75 backdrop-blur-2xl rounded-full relative">
          <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none rounded-full" />
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
            icon={Workflow}
            label={labels.how || "How"}
            active={activeSection === "how"}
            onClick={() => scrollToSection("how-it-works", "how")}
          />
          <div className="w-px h-8 bg-white/[0.08] mx-1 z-10" aria-hidden />
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
          "transition-all duration-300 flex items-center justify-center relative cursor-pointer outline-none select-none shrink-0 z-10 rounded-full",
          active
            ? "w-10 h-10 text-primary scale-110 drop-shadow-[0_0_8px_rgba(0,122,255,0.4)]"
            : "w-10 h-10 text-white/50 hover:text-white active:scale-90"
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
        className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)] border border-primary/20 active:scale-95 hover:bg-primary/20 transition-all duration-300 cursor-pointer outline-none select-none shrink-0"
        style={{ WebkitTapHighlightColor: "transparent", borderRadius: "9999px" }}
      >
        <CalendarDays className="w-5 h-5 drop-shadow-[0_0_8px_rgba(0,122,255,0.4)]" />
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
